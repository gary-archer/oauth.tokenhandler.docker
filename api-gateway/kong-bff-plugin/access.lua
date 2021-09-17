local _M = { conf = {} }
local ck = require "resty.cookie"
local aes = require "resty.aes"
local string = require "string"
local table = require "table"

local function array_has_value(arr, val)
    for index, value in ipairs(arr) do
        if value == val then
            return true
        end
    end

    return false
end

--
-- Return errors to the browser and ensure that the browser can read the response
--
local function error_response(status, code, message, config)

    local jsonData = '{"code":"' .. code .. '", "message":"' .. message .. '"}'
    ngx.status = status
    ngx.header['content-type'] = 'application/json'

    if config.trusted_web_origins then

        local origin = ngx.req.get_headers()["origin"]
        if origin and array_has_value(config.trusted_web_origins, origin) then
            ngx.header['Access-Control-Allow-Origin'] = origin
            ngx.header['Access-Control-Allow-Credentials'] = 'true'
        end
    end

    ngx.say(jsonData)
    ngx.exit(status)
end

--
-- Return a generic message for all three of these error categories
--
local function unauthorized_request_error_response(config)
    error_response(ngx.HTTP_UNAUTHORIZED, "unauthorized", "The request failed cookie authorization", config)
end

local function split(inputstr, sep)
    local result={}
    for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
        table.insert(result, str)
    end

    return result
end

local function from_hex(str)
    return (str:gsub('..', function (cc)
        return string.char(tonumber(cc, 16))
    end))
end

local function get_error_message(baseMessage, err)
    local message = baseMessage
    if err then
        message = message .. ": " .. err
    end
    return message
end

local function decrypt_cookie(encrypted_cookie, encryption_key)
    local encrypted = ngx.unescape_uri(encrypted_cookie)

    local parts = split(encrypted, ":")

    local iv = from_hex(parts[1])
    local data = from_hex(parts[2])

    local cipher = aes.cipher(256)
    local aes_256_cbc_md5, err = aes:new(encryption_key, nil, cipher, { iv=iv })

    if err then
        ngx.log(ngx.WARN, "Error creating decipher" .. err)
        return
    end

    return aes_256_cbc_md5:decrypt(data)
end

--
-- The public entry point to decrypt the BFF cookie and then forward the token to the API
--
function _M.run(config)

    local method = ngx.req.get_method() 
    if method == "OPTIONS" then
        return
    end

    local cookie = ck:new()

    -- First verify the web origin
    if config.trusted_web_origins then

        local web_origin = ngx.req.get_headers()["origin"]
        ngx.log(ngx.WARN, "Found origin " .. web_origin)
        if not web_origin or not array_has_value(config.trusted_web_origins, web_origin) then
            ngx.log(ngx.WARN, "The request was from an untrusted web origin")
            unauthorized_request_error_response(config)
        end
    end

    -- Next verify that the main cookie was received and get the access token
    ngx.log(ngx.WARN, "Looking for " .. config.cookie_name_prefix .. "-at-finalspa")
    local at_cookie, err = cookie:get(config.cookie_name_prefix .. "-at-finalspa")
    if err or not at_cookie then
        ngx.log(ngx.WARN, get_error_message("No access token cookie was sent with the request", err))
        unauthorized_request_error_response(config)
    end

    local access_token, err = decrypt_cookie(at_cookie, config.encryption_key)
    if err or not access_token then
        ngx.log(ngx.WARN, get_error_message("Error when decrypting access token cookie - ", err))
        unauthorized_request_error_response(config)
    end

    -- For data changing requests we also expect a CSRF header to be sent with the double submit cookie
    if method == "POST" or method == "PUT" or method == "DELETE" or method == "PATCH" then

        local csrf_cookie, err = cookie:get(config.cookie_name_prefix .. "-csrf-finalspa")
        if err or not csrf_cookie then
            ngx.log(ngx.WARN, get_error_message("No CSRF cookie was sent with the request", err))
            unauthorized_request_error_response(config)
        end

        local csrf_token, err = decrypt_cookie(csrf_cookie, config.encryption_key)
        if err or not csrf_token then
            ngx.log(ngx.WARN, get_error_message("Error when decrypting CSRF cookie", err))
            unauthorized_request_error_response(config)
        end

        local csrf_header = ngx.req.get_headers()["x-" .. config.cookie_name_prefix .. "-csrf"]
        if not csrf_header or csrf_header ~= csrf_token  then
            ngx.log(ngx.WARN, get_error_message("Invalid or missing CSRF request header", err))
            unauthorized_request_error_response(config)
        end
    end

    ngx.log(ngx.INFO, "Secure cookies were successfully authorized")
    ngx.req.set_header("Authorization", "Bearer " .. access_token)

end

return _M

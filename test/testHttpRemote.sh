#
# Helper commands to test the back end for front end OAuth workflow
#

export HTTPS_PROXY=http://127.0.0.1:8888

#
# Get an authorization redirect URL, which will also set a temporary cookie containing the state and code verifier
#

#
# Complete a login by swapping the code for tokens
#
curl -i -X POST https://api.authsamples.com/oauthwebproxy/authorization-code-grant \
-H 'origin: https://web.authsamples.com' \
-H 'content-type: application/x-www-form-urlencoded' \
-H 'accept: application/json' \
--data-urlencode 'code=e6c42e8e-fda7-4c7e-a850-b007bacd98a5' \
--data-urlencode 'state=xxx'

#
# Refresh an access token
#
curl -X POST https://api.authsamples.com/oauthwebproxy/refresh-token-grant \
-H 'origin: https://web.authsamples.com' \
-H 'content-type: application/x-www-form-urlencoded' \
-H 'accept: application/json' \
-H "cookie: mycompany-auth-finalspa=ccdf87a9bce50e1c80a9dbcf9517a55c%3A9817905c2e6b4b5ddaf6a29ca654fe4af1109b2348d6ba12b752531f4c87c11f60194f409a5e2f0772859f70f6c0e62e97ebd24b86a25f9e547d794aa74ae1648cf8445368a8a46571ca425612066f9c00609c16cb4e6fe3f45ccd6862a801593caea6cb52371fd91efe8d2628a12eb220abb1bcf8718570c991e8d557d85f6196f16cf22bd7c17c099002f4593ad56ca16179808be2cc54ede3d913f1ce351dd1fc0ea2ba8fadd01f4abec4121bcdba7dbb9b2686dfba40b4f19c194c5fff68c710c77d6424f8ee1bfb315210665ec1c9bc53621355a225a074894e86d3727936ac60541cdfbf96d1a6b2c74d458030fc676af73305f32ef639315941022195340ef0da7db53f9951c208b91b0c7638fd3f27e006c58b169c4bf0eb213b365135f8b3af1e233c21156c4a063b5d9fc9869834f7a660559bf7dd3ceed8d21e032a37718dd325efc579aaabe984f47fc3835e5634e39576a230c6f664b4f7181407e2793886baf8df4ac1a342663680ea65d60c6a4227a75df32e9cc9b7f347a0b948884e205bf3f486f1e130ded2405b1427718d7b17d029e10efeb0d343a9cdffe96ea5c3f19c982515b4f3544a8c770a73ffe68603a19ad3838f776ce313786455f65beab1a44d08ef2d8d9d7beeaf57f0cfdd9e414d13144cd1161f633faa278110730af24618e835c6660871f48353157e53b35ce35e7c459c443c9aae44174ff32686f0dc95904f1f55aea050fc2c4f583d7167eed98b45c0cf856b3c5b78013c7deaa64499d4ad7de1eb33b69cc06b13944cfe5be6e82af573ef0b661586eeff24dc0ddd4a98143f5984561605fe85587a0e3d456e3ecaff72e125f62278b4cb34ffce93e05e9d8af3af03e3a080dc9e41e452fee0c88a83d26fb181fcf0560df423a5528dc4b9ad2991fed40b7cfad2aec455fa5d211e9512296097e37278741cf203ac3802e16225db85968277a7044539a3bb4f8b159a69f8aad12e49712d32fd13cfb63321f5065b7e8c60f101cc469947a5b19cf2fa6bd0ab28b07c808103b6d6df825a72c57715395ccdf82fa035948a2b979f11201179e10cb99af2dd21624556f8b8988bd042edc65eda879b0e43ed5ec2df0178d9348681530dd34d48c3357d8de70128590d54279532238cd32d7266c98f1bb94a7161c17ffcc8dd15ec2808aa8eb83adaaf0505ad01559bd6398c2e3f7a18400dd72eea754d08e337883c45c3b5f958ea398bfa0ca1a7208e65a5c6927815f063fe50cc4d51f3c46e0007ebc77802670734df1e2dcdf2df4e2c2f76e1588fecafed47dcfcc24bd8db569a8ebb1afefe23620889f001e86392508fab19748ee8a42e21762150ea2c0cd77bf6f5801f734d2f776e9d9819f6af7504dc8e4ebab27e643b1e1f28c5cefb8e2aaf74da9144a70bb14f1a9245d42a8cec4c7bf0898a8eff1bab372947521714eab4a8b98d7f37f68d7bc978a123bdff9850819955aa5f690748ecbd01de750ae450fd46ae32d9f867ca2ed9b46b6d73fa1658895748e9a5a541b18979e56bb3694a0816f23c9530caee1cc3717af0c192d81ec11d921aa9a264d3bf26284507422a533110bb4408c2426b87666d9c571a95d2b28a616b78b0a300c1f51b1fcf4debbf680354e2bc633e589b007b61931982be34ef22458bec687645fc932dc2b812087aabc7d6cbf83bf108ef6c153c8505ca434b27b39688598af7e6ad81aec3d42f9d6c425f6550eb58cbf7873a831a106796081ba1f17126ce511ddd5b63753f97bddbaca88ea288530272f5175ae7e2c3fcfdb9f73d7145c4c7c32c5ad969722c19588e9c7bbf1f3aa72f9509c4431e5caf505133831a0fdb02422bcc6ab343965a4af66821d3ac761138df3b9395f7d4991d05e098b79c3b73d97cca9d0c0c549e63f2ffe74e6470749bd1de8d4d4ed7f32ae46b49e255a210c7bb93886995e1714742cd602b113e1f5bd213d49fa6a8915389f67a389544317182215861173ded24c8ab2737ea61064878df072a85e9ae74cb9204f312b8d517c8855fbb46618c77e4a1c87ed59de0dd419f7796f1466072a817d93de3912582d86f36fb09c1789c7e89b39b695d607d32d24396862770a1879a4ff741fa8493a09bb5f17d68dd871c0fb39cf585a5025703cc3556f005393e3a60570c41c9c0ba067f7b1ea336ce159a4b1f02f9d5397d000bb0e5a441fbc6d595934321eb1fc4232beaec5b7f3be94df9ba0df2a689e6cd49b3977ee3adb6b653f9eba206a29630093382782b6b91871799d91ebc27b7a5ca0356e2a035f15f7b1ddb7f13e24cde7f779e7a7b456089919eca838e2ac1b875cb4e0398985d43c28d68a64fbecd0fcd11dbdb8956f7fb86b6a75486ba7224bad1fd9113ef9aee2b0b666599dffe4e15a59e8d028a9f6ea1838013741b70e8df7dc0f76a652521245ca09ee7fb3326965a7de18d1a824304ee67571c20abf3dc43515c1b24ead200c32e8c76f2358d1801d57cec13c992e74bebcae9a103234a9078ca4453c470991366f4" \
-H "cookie: mycompany-csrf-finalspa=ac8c2daa8ceb463bf35f4c59c83e52c4%3A0dd4c6b9b8718264f75e0d45b90129cb9e1d6ea18890645673bdf92995589fe1e9c13ced5198565890e81f90b6870a81"

#
# Add characters to the refresh token to make it return invalid_grant when used
#
curl -X POST https://api.authsamples.com/oauthwebproxy/expire-refresh-token \
-H 'origin: https://web.authsamples.com' \
-H "cookie: mycompany-auth-finalspa=ccdf87a9bce50e1c80a9dbcf9517a55c%3A9817905c2e6b4b5ddaf6a29ca654fe4af1109b2348d6ba12b752531f4c87c11f60194f409a5e2f0772859f70f6c0e62e97ebd24b86a25f9e547d794aa74ae1648cf8445368a8a46571ca425612066f9c00609c16cb4e6fe3f45ccd6862a801593caea6cb52371fd91efe8d2628a12eb220abb1bcf8718570c991e8d557d85f6196f16cf22bd7c17c099002f4593ad56ca16179808be2cc54ede3d913f1ce351dd1fc0ea2ba8fadd01f4abec4121bcdba7dbb9b2686dfba40b4f19c194c5fff68c710c77d6424f8ee1bfb315210665ec1c9bc53621355a225a074894e86d3727936ac60541cdfbf96d1a6b2c74d458030fc676af73305f32ef639315941022195340ef0da7db53f9951c208b91b0c7638fd3f27e006c58b169c4bf0eb213b365135f8b3af1e233c21156c4a063b5d9fc9869834f7a660559bf7dd3ceed8d21e032a37718dd325efc579aaabe984f47fc3835e5634e39576a230c6f664b4f7181407e2793886baf8df4ac1a342663680ea65d60c6a4227a75df32e9cc9b7f347a0b948884e205bf3f486f1e130ded2405b1427718d7b17d029e10efeb0d343a9cdffe96ea5c3f19c982515b4f3544a8c770a73ffe68603a19ad3838f776ce313786455f65beab1a44d08ef2d8d9d7beeaf57f0cfdd9e414d13144cd1161f633faa278110730af24618e835c6660871f48353157e53b35ce35e7c459c443c9aae44174ff32686f0dc95904f1f55aea050fc2c4f583d7167eed98b45c0cf856b3c5b78013c7deaa64499d4ad7de1eb33b69cc06b13944cfe5be6e82af573ef0b661586eeff24dc0ddd4a98143f5984561605fe85587a0e3d456e3ecaff72e125f62278b4cb34ffce93e05e9d8af3af03e3a080dc9e41e452fee0c88a83d26fb181fcf0560df423a5528dc4b9ad2991fed40b7cfad2aec455fa5d211e9512296097e37278741cf203ac3802e16225db85968277a7044539a3bb4f8b159a69f8aad12e49712d32fd13cfb63321f5065b7e8c60f101cc469947a5b19cf2fa6bd0ab28b07c808103b6d6df825a72c57715395ccdf82fa035948a2b979f11201179e10cb99af2dd21624556f8b8988bd042edc65eda879b0e43ed5ec2df0178d9348681530dd34d48c3357d8de70128590d54279532238cd32d7266c98f1bb94a7161c17ffcc8dd15ec2808aa8eb83adaaf0505ad01559bd6398c2e3f7a18400dd72eea754d08e337883c45c3b5f958ea398bfa0ca1a7208e65a5c6927815f063fe50cc4d51f3c46e0007ebc77802670734df1e2dcdf2df4e2c2f76e1588fecafed47dcfcc24bd8db569a8ebb1afefe23620889f001e86392508fab19748ee8a42e21762150ea2c0cd77bf6f5801f734d2f776e9d9819f6af7504dc8e4ebab27e643b1e1f28c5cefb8e2aaf74da9144a70bb14f1a9245d42a8cec4c7bf0898a8eff1bab372947521714eab4a8b98d7f37f68d7bc978a123bdff9850819955aa5f690748ecbd01de750ae450fd46ae32d9f867ca2ed9b46b6d73fa1658895748e9a5a541b18979e56bb3694a0816f23c9530caee1cc3717af0c192d81ec11d921aa9a264d3bf26284507422a533110bb4408c2426b87666d9c571a95d2b28a616b78b0a300c1f51b1fcf4debbf680354e2bc633e589b007b61931982be34ef22458bec687645fc932dc2b812087aabc7d6cbf83bf108ef6c153c8505ca434b27b39688598af7e6ad81aec3d42f9d6c425f6550eb58cbf7873a831a106796081ba1f17126ce511ddd5b63753f97bddbaca88ea288530272f5175ae7e2c3fcfdb9f73d7145c4c7c32c5ad969722c19588e9c7bbf1f3aa72f9509c4431e5caf505133831a0fdb02422bcc6ab343965a4af66821d3ac761138df3b9395f7d4991d05e098b79c3b73d97cca9d0c0c549e63f2ffe74e6470749bd1de8d4d4ed7f32ae46b49e255a210c7bb93886995e1714742cd602b113e1f5bd213d49fa6a8915389f67a389544317182215861173ded24c8ab2737ea61064878df072a85e9ae74cb9204f312b8d517c8855fbb46618c77e4a1c87ed59de0dd419f7796f1466072a817d93de3912582d86f36fb09c1789c7e89b39b695d607d32d24396862770a1879a4ff741fa8493a09bb5f17d68dd871c0fb39cf585a5025703cc3556f005393e3a60570c41c9c0ba067f7b1ea336ce159a4b1f02f9d5397d000bb0e5a441fbc6d595934321eb1fc4232beaec5b7f3be94df9ba0df2a689e6cd49b3977ee3adb6b653f9eba206a29630093382782b6b91871799d91ebc27b7a5ca0356e2a035f15f7b1ddb7f13e24cde7f779e7a7b456089919eca838e2ac1b875cb4e0398985d43c28d68a64fbecd0fcd11dbdb8956f7fb86b6a75486ba7224bad1fd9113ef9aee2b0b666599dffe4e15a59e8d028a9f6ea1838013741b70e8df7dc0f76a652521245ca09ee7fb3326965a7de18d1a824304ee67571c20abf3dc43515c1b24ead200c32e8c76f2358d1801d57cec13c992e74bebcae9a103234a9078ca4453c470991366f4" \
-H "cookie: mycompany-csrf-finalspa=ac8c2daa8ceb463bf35f4c59c83e52c4%3A0dd4c6b9b8718264f75e0d45b90129cb9e1d6ea18890645673bdf92995589fe1e9c13ced5198565890e81f90b6870a81"

#
# Rewrite all cookies as expired
#
curl -X DELETE https://api.authsamples.com/oauthwebproxy/expire-session \
-H 'origin: https://web.authsamples.com' \
-H "cookie: mycompany-auth-finalspa=ccdf87a9bce50e1c80a9dbcf9517a55c%3A9817905c2e6b4b5ddaf6a29ca654fe4af1109b2348d6ba12b752531f4c87c11f60194f409a5e2f0772859f70f6c0e62e97ebd24b86a25f9e547d794aa74ae1648cf8445368a8a46571ca425612066f9c00609c16cb4e6fe3f45ccd6862a801593caea6cb52371fd91efe8d2628a12eb220abb1bcf8718570c991e8d557d85f6196f16cf22bd7c17c099002f4593ad56ca16179808be2cc54ede3d913f1ce351dd1fc0ea2ba8fadd01f4abec4121bcdba7dbb9b2686dfba40b4f19c194c5fff68c710c77d6424f8ee1bfb315210665ec1c9bc53621355a225a074894e86d3727936ac60541cdfbf96d1a6b2c74d458030fc676af73305f32ef639315941022195340ef0da7db53f9951c208b91b0c7638fd3f27e006c58b169c4bf0eb213b365135f8b3af1e233c21156c4a063b5d9fc9869834f7a660559bf7dd3ceed8d21e032a37718dd325efc579aaabe984f47fc3835e5634e39576a230c6f664b4f7181407e2793886baf8df4ac1a342663680ea65d60c6a4227a75df32e9cc9b7f347a0b948884e205bf3f486f1e130ded2405b1427718d7b17d029e10efeb0d343a9cdffe96ea5c3f19c982515b4f3544a8c770a73ffe68603a19ad3838f776ce313786455f65beab1a44d08ef2d8d9d7beeaf57f0cfdd9e414d13144cd1161f633faa278110730af24618e835c6660871f48353157e53b35ce35e7c459c443c9aae44174ff32686f0dc95904f1f55aea050fc2c4f583d7167eed98b45c0cf856b3c5b78013c7deaa64499d4ad7de1eb33b69cc06b13944cfe5be6e82af573ef0b661586eeff24dc0ddd4a98143f5984561605fe85587a0e3d456e3ecaff72e125f62278b4cb34ffce93e05e9d8af3af03e3a080dc9e41e452fee0c88a83d26fb181fcf0560df423a5528dc4b9ad2991fed40b7cfad2aec455fa5d211e9512296097e37278741cf203ac3802e16225db85968277a7044539a3bb4f8b159a69f8aad12e49712d32fd13cfb63321f5065b7e8c60f101cc469947a5b19cf2fa6bd0ab28b07c808103b6d6df825a72c57715395ccdf82fa035948a2b979f11201179e10cb99af2dd21624556f8b8988bd042edc65eda879b0e43ed5ec2df0178d9348681530dd34d48c3357d8de70128590d54279532238cd32d7266c98f1bb94a7161c17ffcc8dd15ec2808aa8eb83adaaf0505ad01559bd6398c2e3f7a18400dd72eea754d08e337883c45c3b5f958ea398bfa0ca1a7208e65a5c6927815f063fe50cc4d51f3c46e0007ebc77802670734df1e2dcdf2df4e2c2f76e1588fecafed47dcfcc24bd8db569a8ebb1afefe23620889f001e86392508fab19748ee8a42e21762150ea2c0cd77bf6f5801f734d2f776e9d9819f6af7504dc8e4ebab27e643b1e1f28c5cefb8e2aaf74da9144a70bb14f1a9245d42a8cec4c7bf0898a8eff1bab372947521714eab4a8b98d7f37f68d7bc978a123bdff9850819955aa5f690748ecbd01de750ae450fd46ae32d9f867ca2ed9b46b6d73fa1658895748e9a5a541b18979e56bb3694a0816f23c9530caee1cc3717af0c192d81ec11d921aa9a264d3bf26284507422a533110bb4408c2426b87666d9c571a95d2b28a616b78b0a300c1f51b1fcf4debbf680354e2bc633e589b007b61931982be34ef22458bec687645fc932dc2b812087aabc7d6cbf83bf108ef6c153c8505ca434b27b39688598af7e6ad81aec3d42f9d6c425f6550eb58cbf7873a831a106796081ba1f17126ce511ddd5b63753f97bddbaca88ea288530272f5175ae7e2c3fcfdb9f73d7145c4c7c32c5ad969722c19588e9c7bbf1f3aa72f9509c4431e5caf505133831a0fdb02422bcc6ab343965a4af66821d3ac761138df3b9395f7d4991d05e098b79c3b73d97cca9d0c0c549e63f2ffe74e6470749bd1de8d4d4ed7f32ae46b49e255a210c7bb93886995e1714742cd602b113e1f5bd213d49fa6a8915389f67a389544317182215861173ded24c8ab2737ea61064878df072a85e9ae74cb9204f312b8d517c8855fbb46618c77e4a1c87ed59de0dd419f7796f1466072a817d93de3912582d86f36fb09c1789c7e89b39b695d607d32d24396862770a1879a4ff741fa8493a09bb5f17d68dd871c0fb39cf585a5025703cc3556f005393e3a60570c41c9c0ba067f7b1ea336ce159a4b1f02f9d5397d000bb0e5a441fbc6d595934321eb1fc4232beaec5b7f3be94df9ba0df2a689e6cd49b3977ee3adb6b653f9eba206a29630093382782b6b91871799d91ebc27b7a5ca0356e2a035f15f7b1ddb7f13e24cde7f779e7a7b456089919eca838e2ac1b875cb4e0398985d43c28d68a64fbecd0fcd11dbdb8956f7fb86b6a75486ba7224bad1fd9113ef9aee2b0b666599dffe4e15a59e8d028a9f6ea1838013741b70e8df7dc0f76a652521245ca09ee7fb3326965a7de18d1a824304ee67571c20abf3dc43515c1b24ead200c32e8c76f2358d1801d57cec13c992e74bebcae9a103234a9078ca4453c470991366f4" \
-H "cookie: mycompany-csrf-finalspa=ac8c2daa8ceb463bf35f4c59c83e52c4%3A0dd4c6b9b8718264f75e0d45b90129cb9e1d6ea18890645673bdf92995589fe1e9c13ced5198565890e81f90b6870a81"

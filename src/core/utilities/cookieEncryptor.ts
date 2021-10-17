import crypto from 'crypto';

/*
 * TODO: put back the old solution
 */
export class CookieEncryptor {

    /*
     * Encrypt the payload
     */
    public static encrypt(payload: string, symmetricKey: string): string {

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes256', symmetricKey, iv);

        const parts = [
            iv.toString('hex'),
            ':',
            cipher.update(payload, 'utf8', 'hex'),
            cipher.final('hex')
        ];

        return parts.join('');
    }

    /*
     * Decrypt the payload
     */
    public static decrypt(payload: string, symmetricKey: string): string {

        const encryptedArray = payload.split(':');
        const iv = Buffer.from(encryptedArray[0], 'hex');
        const encrypted = encryptedArray[1];
        const decipher = crypto.createDecipheriv('aes256', symmetricKey, iv);
        return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    }
}

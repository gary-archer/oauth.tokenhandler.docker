/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const handler = async (event: any) => {

    console.log('REFRESH TOKEN GRANT');
    console.log(event.headers.cookie);

    const data = {
        access_token: 'xxx',
    };

    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};

export {handler};

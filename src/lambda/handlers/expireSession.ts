/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const handler = async (event: any) => {

    console.log('EXPIRE SESSION');
    console.log(event.headers.cookie);

    return {
        statusCode: 204,
        headers: 'set-cookie: xxx=yyy-expired',
    };
};

export {handler};

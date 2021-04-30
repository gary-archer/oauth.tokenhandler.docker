/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const handler = async (event: any) => {

    console.log('AUTHORIZATION CODE GRANT');
    console.log(event.body);

    const data = {
        message: 'AUTHORIZATION CODE GRANT',
        data: event.body,
    };

    return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: 'set-cookie: xxx=yyy',
    };
};

export {handler};

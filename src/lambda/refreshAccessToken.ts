const handler = async (event: any) => {

    console.log('REFRESH TOKEN GRANT');
    console.log(event.body);
    console.log(event.headers.cookie);

    const data = {
        message: 'REFRESH TOKEN GRANT',
        data: event.body,
        cookie: event.headers.cookie,
    };

    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};

export {handler};

const handler = async (event: any) => {

    console.log('AUTHORIZATION CODE GRANT');
    console.log(event.body);

    const data = {
        message: 'AUTHORIZATION CODE GRANT',
        data: event.body,
    };

    return {
        statusCode: 200,
        headers: 'set-cookie: xxx=yyy',
        body: JSON.stringify(data),
    };
};

export {handler};

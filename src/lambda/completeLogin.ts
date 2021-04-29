const handler = async (event: any, context: any) => {

    console.log('AUTHORIZATION CODE GRANT');
    console.log(event.body);
    
    // Client
    const data = {
        message: 'AUTHORIZATION CODE GRANT',
        data: event.body,
    };

    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};

export {handler};

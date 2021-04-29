const handler = async (event: any, context: any) => {

    console.log('AUTHORIZATION CODE GRANT');
    console.log(event);
    console.log(context);
    const data = {
        message: 'AUTHORIZATION CODE GRANT',
    };

    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};

export {handler};

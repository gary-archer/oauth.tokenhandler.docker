const handler = async (event: any, context: any) => {

    console.log('REFRESH TOKEN GRANT');
    console.log(event);
    console.log(context);
    const data = {
        message: 'REFRESH TOKEN GRANT',
    };

    return {
        statusCode: 200,
        body: JSON.stringify(data),
    };
};

export {handler};

//Standard API success response.
export const successResponse = (
    res, 
    statusCode = 200,
    message = "Success",
    data = null
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};


export const errorResponse =(
    res, 
    statusCode = 500,
    error = "SERVER_ERROR",
    message = "Something went wrong."
)=> {
    return res.status(statusCode).json({
        success: false,
        errror,
        message,
    });
};
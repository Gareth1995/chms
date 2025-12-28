import React from 'react';

const Card = ({ children, title, subTitle, backAction, actionComponent }) => {
    return (
        <div className='min-h-screen flex items-center justify-center p4'>
            <div className='bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col'>
                {/* Check if any header element is present */}
                {(title || subTitle || backAction || actionComponent) && (
                    <div className='px-6 pt-6 pb-2'>
                        
                        {/* 1. Back Button */}
                        {backAction && (
                            <button
                                onClick={backAction}
                                className='text-blue-500 text-sm mb-2 hover:underline flex items-center gap-1'
                            >
                                ← Back
                            </button>
                        )}

                        {/* 2. Title Section and Action Button in a flex container */}
                        <div className="flex justify-between items-start">
                            <div>
                                {title && <h2 className='text-xl font-bold text-gray-800'>{title}</h2>}
                                {subTitle && <p className='text-gray-500 text-sm'>{subTitle}</p>}
                            </div>
                            {/* Render the action component (e.g., Logout button) here */}
                            {actionComponent}
                        </div>     
                    </div>
                )}
                
                <div className='p-6 flex-1'>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Card
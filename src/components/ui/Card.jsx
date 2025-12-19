import React from 'react';

const Card = ({children, title, subTitle}) => {
    return (
        <div className='min-h-screen flex items-center justify-center p4'>
            <div className='bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col'>
                {(title || subTitle) && (
                    <div className='px-6 pt-6 pb-2'>
                        {title && <h2 className='text-xl font-bold text-gray-800'>{title}</h2>}
                        {subTitle && <p className='text-gray-500 text-sm'>{subTitle}</p>}
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
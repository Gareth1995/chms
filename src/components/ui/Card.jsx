// import React from 'react';

// const Card = ({ children, title, subTitle, backAction, actionComponent }) => {
//     return (
//         <div className='min-h-screen flex items-center justify-center p-4'>
//             {/* Note: Kept your max-w-md here, but you can change it to max-w-lg if you still want it wider */}
//             <div className='bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col'>
//                 {/* Check if any header element is present */}
//                 {(title || subTitle || backAction || actionComponent) && (
//                     <div className='px-6 pt-6 pb-2'>
                        
//                         {/* 1. Back Button */}
//                         {backAction && (
//                             <button
//                                 onClick={backAction}
//                                 className='text-blue-500 text-sm mb-2 hover:underline flex items-center gap-1'
//                             >
//                                 ← Back
//                             </button>
//                         )}

//                         {/* 2. Title Section and Action Button in a flex container */}
//                         <div className="flex justify-between items-start">
//                             <div>
//                                 {title && <h2 className='text-xl font-bold text-gray-800'>{title}</h2>}
//                                 {subTitle && <p className='text-gray-500 text-sm'>{subTitle}</p>}
//                             </div>
//                             {/* Render the action component (e.g., Logout button) here */}
//                             {actionComponent}
//                         </div>    
//                     </div>
//                 )}
                
//                 {/* ADDED overflow-x-auto HERE */}
//                 <div className='p-6 flex-1 overflow-x-auto'>
//                     {children}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Card;

import React from 'react';

const Card = ({ children, title, subTitle, backAction, actionComponent }) => {
    return (
        <div className='min-h-screen flex items-center justify-center p-4'>
            {/* ADDED max-h-[90vh] HERE so the card stops growing at 90% of the screen height */}
            <div className='bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden min-h-[500px] max-h-[90vh] flex flex-col'>
                {/* Check if any header element is present */}
                {(title || subTitle || backAction || actionComponent) && (
                    <div className='px-6 pt-6 pb-2 shrink-0'>
                        
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
                
                {/* CHANGED overflow-x-auto to overflow-auto to handle both horizontal and vertical scrolling */}
                <div className='p-6 flex-1 overflow-auto'>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Card;
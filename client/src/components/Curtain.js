import React from 'react';
import { motion } from 'framer-motion';

const Curtain = ({ onAnimationComplete }) => {
    const transition = {
        duration: 4.0,
        ease: "circOut", // A smoother easing function
        delay: 0.2
    };

    return (
        <>
            {/* Left Curtain */}
            <motion.div
                className="fixed top-0 left-0 w-1/2 h-full bg-[#a10107] z-50"
                initial={{ x: '0%', skewX: 0, borderTopRightRadius: '10px', borderBottomRightRadius: '10px' }}
                animate={{
                    x: '-100%',
                    skewX: [0, -2, 2, -1, 1, 0], // More complex wave
                    borderTopRightRadius: '0px',
                    borderBottomRightRadius: '0px'
                }}
                transition={transition}
            />
            {/* Right Curtain */}
            <motion.div
                className="fixed top-0 right-0 w-1/2 h-full bg-[#a10107] z-50"
                initial={{ x: '0%', skewX: 0, borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }}
                animate={{
                    x: '100%',
                    skewX: [0, 2, -2, 1, -1, 0], // More complex wave
                    borderTopLeftRadius: '0px',
                    borderBottomLeftRadius: '0px'
                }}
                transition={transition}
                onAnimationComplete={onAnimationComplete}
            />
        </>
    );
};

export default Curtain;
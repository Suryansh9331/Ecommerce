import React from 'react';

import { Link } from 'react-router-dom';

const NewSection: React.FC = () => {
    const sections = [
        {
            id: 1,
            image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGpld2Vscnl8ZW58MHx8MHx8fDA%3D",
            title: "LIMITED TIME EDITION",
            subtitles: ["Heartfelt creations", "Made with love"],
            buttonText: "SHOP ALL",
            link: "/shop"
        },
        {
            id: 2,
            image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=1000&auto=format&fit=crop",
            title: "BUY 2 GET 1 FREE",
            subtitles: ["Add 3 products to cart and offer applies automatically"],
            buttonText: "PLACE ORDER NOW",
            link: "/shop"
        }
    ];

    return (
        <section className="py-4 bg-white">
            <div className="container mx-auto px-4 xl:px-14">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-medium font-worksans text-gray-900 mb-3 tracking-wide uppercase">
                        EASY TO STYLE JEWELLERY
                    </h2>
                    <p className="text-gray-600 font-worksans text-lg">
                        All-Occasion Jewellery Specially Made For You
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section) => (
                        <div key={section.id} className="relative group overflow-hidden h-[400px] md:h-[500px]">
                            {/* Background Image */}
                            <img
                                src={section.image}
                                alt={section.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlay & Content */}
                            <div className="absolute inset-0 bg-black/20 p-6 flex flex-col items-center justify-center text-center">
                                {/* Inner White Border Frame */}
                                <div className="absolute inset-4 border border-white/60 pointer-events-none"></div>

                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <h3 className="text-white text-3xl md:text-4xl font-playfair tracking-wide font-normal">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {section.subtitles.map((subtitle, index) => (
                                            <p key={index} className="text-white/90 font-worksans text-sm uppercase tracking-widest">
                                                {subtitle}
                                            </p>
                                        ))}
                                    </div>

                                    <Link
                                        to={section.link}
                                        className="mt-6 px-8 py-2.5 border border-white text-white uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300 font-medium"
                                    >
                                        {section.buttonText}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewSection;

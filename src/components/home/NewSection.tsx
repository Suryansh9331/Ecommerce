import React from 'react';

import { Link } from 'react-router-dom';

const NewSection: React.FC = () => {
    const sections = [
        {
            id: 1,
            image: "https://res.cloudinary.com/dggzjpqdi/image/upload/v1786430437/ChatGPT_Image_Aug_11_2026_12_09_52_PM_btorqm.png",
            title: "",
            subtitles: ["Heartfelt creations", "Made with love"],
            buttonText: "SHOP ALL",
            link: "/all-products"
        },
        {
            id: 2,
            image: "https://res.cloudinary.com/dggzjpqdi/image/upload/v1786430800/ChatGPT_Image_Aug_11_2026_12_15_52_PM_y36sgo.png",
            title: "BUY 2 GET 1 FREE",
            subtitles: ["Add 3 products to cart and offer applies automatically"],
            buttonText: "PLACE ORDER NOW",
            link: "/all-products"
        }
    ];

    return (
        <section className="py-4 bg-white">
            <div className="container mx-auto px-4 xl:px-14">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-medium font-worksans text-gray-900 mb-3 tracking-wide uppercase">
                        CRAFTED WITH TRADITION
                    </h2>
                    <p className="text-gray-600 font-worksans text-lg">
                       Timeless Pottery, Thoughtfully Made for You
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section) => (
                        // The whole card is the link, so clicking the image does exactly
                        // what the call-to-action does.
                        <Link
                            key={section.id}
                            to={section.link}
                            className="group block"
                        >
                            {/* Both artworks are portrait posters with type running close to
                                the edges, so object-contain guarantees nothing is ever cropped.
                                The 3:4 frame is the closest ratio to the two images (2:3 and
                                ~3:4), which keeps the letterbox margins minimal while still
                                giving both cards the same height. */}
                            <div className="overflow-hidden rounded-lg bg-gray-50 aspect-[3/4]">
                                <img
                                    src={section.image}
                                    alt={section.title || section.subtitles[0]}
                                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                                />
                            </div>

                            {/* Content sits below the image so nothing overlays the artwork */}
                            <div className="mt-5 flex flex-col items-center gap-3 text-center">
                                {section.title && (
                                    <h3 className="text-gray-900 text-2xl md:text-3xl font-playfair tracking-wide font-normal">
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {section.subtitles.map((subtitle, index) => (
                                        <p key={index} className="text-gray-600 font-worksans text-sm uppercase tracking-widest">
                                            {subtitle}
                                        </p>
                                    ))}
                                </div>

                                <span className="mt-2 inline-block px-8 py-2.5 border border-primary-600 text-primary-600 uppercase text-sm tracking-widest group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 font-medium">
                                    {section.buttonText}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewSection;

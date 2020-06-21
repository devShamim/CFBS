(function ($) {
    "use strict";

    let getData = (optionValue , defaultValue) => typeof(optionValue) === 'undefined' ? defaultValue : optionValue;

    // Active Owl Carousel 

    $('.owl-carousel').each(function () {
        $(this).owlCarousel({
            items: getData( $(this).data('items-owl'), 1 ),
            margin: getData( $(this).data('margin-owl'), 0 ),
            loop: getData( $(this).data('loop-owl'), true ),
            smartSpeed: 300,
            autoplay: getData( $(this).data('autoplay-owl'), false ),
            autoplayTimeout: getData( $(this).data('autoplay-timeout-owl'), 8000 ),
            lazyLoad: getData( $(this).data('lazyLoad-owl'), false ),
            center: getData( $(this).data('center-owl'), false ),
            rtl: getData( $(this).data('rtl-owl'), false ),
            animateOut: getData( $(this).data('animateOut-owl'), false ),
            autoHeight: getData( $(this).data('autoHeight-owl'), false ),
            nav: getData( $(this).data('nav-owl'), false ),
            navText: ["<i class='fa fa-angle-left'></i>" , "<i class='fa fa-angle-right'></i>"],
            dots: getData( $(this).data('dots-owl'), false ),
            responsive: getData( $(this).data('responsive-owl'), {} )
        });
    });

    $('.slick-slider').each(function () {
        $(this).slick({
            slidesToShow: getData( $(this).data('slide-slick'), 1 ),
            slidesToScroll: getData( $(this).data('slideScroll-slick'), 1 ),
            infinite: getData( $(this).data('infinity-slick'), true ),
            speed: 300,
            autoplay: getData( $(this).data('autoplay-slick'), false ),
            autoplaySpeed: getData( $(this).data('autoplaySpeed-slick'), 8000 ),
            lazyLoad: getData( $(this).data('lazyLoad-slick'), 'ondemand' ),
            centerMode: getData( $(this).data('center-slick'), false ),
            rtl: getData( $(this).data('rtl-slick'), false ),
            adaptiveHeight: getData( $(this).data('adaptiveHeight-slick'), false ),
            arrows: getData( $(this).data('arrow-slick'), false ),
            prevArrow: ["<span class='slick-prev'><i class='la la-angle-left'></i></span>"],
            nextArrow: ["<span class='slick-next'><i class='la la-angle-right'></i></span>"],
            dots: getData( $(this).data('dots-slick'), false ),
            responsive: getData( $(this).data('responsive-slick'), {} )
        });
    });

})(jQuery);
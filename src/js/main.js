/*! functions.js */
import $ from 'jquery';
import slider1 from './ui/slider'
$.fn.slider = slider1;
  console.log($);
  var slider = $('.banner').slider({
    dots: true,
    fluid: true,
    arrows: true
  });
  $('.slider-arrow').click(function() {
    var fn = this.className.split(' ')[1];

    //  Either do slider.data('slider').next() or .prev() depending on the className
    slider.data('slider')[fn]();
  });

  




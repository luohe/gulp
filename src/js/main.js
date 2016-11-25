/*! functions.js */
  import $ from 'jquery';
  import slider1 from './ui/slider'
  
  $.fn.slider = slider1;
  console.log(1111111);
  var slider = $('.banner').slider({
    dots: true,
    fluid: true,
    arrows: true
  });
  $('.slider-arrow').click(function() {
    var fn = this.className.split(' ')[1];
    slider.data('slider')[fn]();
  });

  




/* globals $ */

'use strict';

$(function () {
  var $window = $(window);

  $('.slide.fullscreen').height($window.height());

  $(window).resize(function () {
    $('.slide.fullscreen').height($window.height());
  });
});

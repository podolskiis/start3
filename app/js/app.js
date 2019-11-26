(function ($) {
  "use strict";

  var $b;

  var fn = {

    // Launch Functions
    Launch: function () {
      // fn.OwlCarousel();
      fn.bsModal();
      fn.fieldLabel();
      fn.fieldIcon();
      fn.checkedBcheck();
    },

    // Owl Carousel
    OwlCarousel: function () {
      $b = $('[data-carousel="owl"]');
      var defaulOptions = {
        navText: [
          '<i class="fas fa-angle-left"></i>',
          '<i class="fas fa-angle-right"></i>'
        ],
      };
      $b.each(function () {
        var a = $(this),
          items = a.data('items') || [1, 1, 1],
          margin = a.data('margin'),
          loop = a.data('loop'),
          nav = a.data('nav'),
          dots = a.data('dots'),
          center = a.data('center'),
          autoplay = a.data('autoplay'),
          autoplaySpeed = a.data('autoplay-speed'),
          rtl = a.data('rtl'),
          autoheight = a.data('autoheight');

        var options = {
          nav: nav || false,
          loop: loop || false,
          dots: dots || false,
          center: center || false,
          autoplay: autoplay || false,
          autoHeight: autoheight || false,
          rtl: rtl || false,
          margin: margin || 0,
          autoplayTimeout: autoplaySpeed || 3000,
          autoplaySpeed: 400,
          autoplayHoverPause: true,
          onInitialized: oninitialized,
          responsive: {
            0: { items: items[2] || 1 },
            576: { items: items[1] || 1 },
            1200: { items: items[0] || 1 }
          }
        };

        if (a.is('.owl-carousel--tm-1')) {
          // example: .owl-carousel(data-carousel="owl").owl-carousel--tm-1
          a.owlCarousel($.extend({}, defaulOptions, {
            loop: true,
            margin: 10,
            nav: true,
            dots: false,
            onInitialized: oninitialized,
            responsive: {
              0: {
                items: 1,
                nav: false,
                dots: true,
              },
              768: {
                items: 3
              },
              1200: {
                items: 5
              }
            }
          }));
        } else {
          // example: .owl-carousel(data-carousel="owl" data-items="[4,2,2]" data-nav="true")
          a.owlCarousel(options);
        }
      });

      function oninitialized() {
        $b = $(this.$element);
        if ($b.find('.owl-dots:not(.disabled)').length) {
          $b.addClass('is-dots');
        }
        if ($b.find('.owl-nav:not(.disabled)').length) {
          $b.addClass('is-nav');
        }
      }
    },

    // Bootstrap Modal
    bsModal: function () {
      $b = $('[data-toggle="modal"]');
      $('.modal').on('show.bs.modal', function (e) {
        $('body').addClass('modal-open modal-open--' + $(this).attr('id'));
        $b.addClass('active');
      }).on('hidden.bs.modal', function (e) {
        $('body').removeClass('modal-open modal-open--' + $(this).attr('id'));
        $b.removeClass('active');
      }).on('click', function (event) {
        if ($(this).is('[data-close="previous-modal"]')) {
          $('.modal').modal('hide');
        }
      });
    },

    // Valid Field-label
    fieldLabel: function () {
      $b = $('.b-field-label');
      $b.each(function () {
        $(this).find('.b-field-label__field').on('change', function () {
          if ($(this).val() != '') {
            $(this).add($(this).parent()).addClass('valid');
          } else {
            $(this).add($(this).parent()).removeClass('valid');
          }
        }).trigger('change');
      });
    },

    // Focus Field-icon
    fieldIcon: function () {
      $b = $('.b-field-icon');
      $b.each(function () {
        $(this).find('.b-field-icon__field:not([readonly])').on('focus', function () {
          $(this).parent().addClass('focus');
          $(this).on('blur', function () {
            $(this).parent().removeClass('focus');
          });
        });
      });
    },

    // Checked B-check
    checkedBcheck: function () {
      $b = $('.b-check');
      function bChange() {
        $b.find('.b-check__input').on('change', function () {
          if ($(this).is(':checked')) {
            $(this).add($(this).closest($b)).addClass('checked');
          } else {
            $(this).add($(this).closest($b)).removeClass('checked');
          }
        }).trigger('change');
      } bChange();
      $b.on('click', bChange);
    },
  };

  $(document).ready(function () {
    fn.Launch();
  });

})(jQuery);
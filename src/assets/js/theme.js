const lamelixCarousel = new Carousel(document.querySelector('.carousel--tm-1'), {
  // 'slidesPerPage': 1
});

(function ($) {

  let $b, QS;

  window.fn = {

    // Launch Functions
    Launch: function () {
      // fn.owlCarousel();
      fn.bsModal();
      fn.fieldIcon();
      fn.checkedBcheck();
    },

    // Owl Carousel
    owlCarousel: function () {
      QS = '[data-carousel="owl"]';
      if (document.querySelector(QS)) {
        $b = $(QS);
        const defaulOptions = {
          navText: [
            '<i class="fas fa-angle-left"></i>',
            '<i class="fas fa-angle-right"></i>'
          ],
        };
        $b.each(function () {
          const a = $(this),
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

          const options = {
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
      }
    },

    // Bootstrap Modal
    bsModal: function () {
      QS = '[data-bs-toggle="modal"]';
      if (document.querySelector(QS)) {
        $b = $(QS);
        $('.modal').on('show.bs.modal', function (e) {
          $('body').addClass('modal-open modal-open--' + $(this).attr('id'));
          $b.addClass('active');
        }).on('hidden.bs.modal', function (e) {
          $('body').removeClass('modal-open modal-open--' + $(this).attr('id'));
          $b.removeClass('active');
        });
        $('[data-bs-close="previous-modal"]').on('show.bs.modal', function (e) {
          $('.modal').not(this).modal('hide');
        });
      }
    },

    // Focus Field-icon
    fieldIcon: function () {
      QS = '.form-field-icon';
      if (document.querySelector(QS)) {
        $b = $(QS);
        $b.each(function () {
          $(this).find('.form-field:not([readonly])').on('focus', function () {
            $(this).parent().addClass('focus');
            $(this).on('blur', function () {
              $(this).parent().removeClass('focus');
            });
          });
          $(this).find('.form-field').on('change keyup', function () {
            if ($(this).val() != '') {
              $(this).add($(this).parent()).addClass('valid');
            } else {
              $(this).add($(this).parent()).removeClass('valid');
            }
          }).trigger('change');
          $(this).find('[data-input="focus"]').on('click', function (e) {
            e.preventDefault();
            $(this).closest(QS).find('.form-field').on('focus');
          });
          $(this).find('.show-password').on('click', function () {
            if ($(this).is('.active')) {
              $(this).removeClass('active').closest(QS).find('.form-field').removeClass('active').removeAttr('type').attr('type', 'password');
            } else {
              $(this).addClass('active').closest(QS).find('.form-field').addClass('active').removeAttr('type').attr('type', 'text');
            }
          });
          $(this).find('.bt.clean-field').on('click', function () {
            $(this).closest(QS).find('.form-field').val('').trigger('change');
          });
        });
      }
    },

    // Checked B-check
    checkedBcheck: function () {
      QS = '.b-check';
      if (document.querySelector(QS)) {
        $b = $(QS);
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
      }
    },
  };

  $(function () {
    window.fn.Launch();
    QS = '[disabled],.disabled';
    if (document.querySelector(QS)) {
      $(QS).on('click', function (e) { e.preventDefault() });
    }
    QS = '[data-select]';
    if (document.querySelector(QS)) {
      $(QS).selectpicker();
    }
  });

})(jQuery);
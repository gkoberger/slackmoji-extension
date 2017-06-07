if (window.location.href.match(/slackmoji/)) {
  $('.btn').text("Add An Emoji!").attr('href', 'https://www.slack.com/customize/emoji');
}

var base = 'https://slackmoji.com';

/*
 * ONE-OFF SEARCH
 * --------------
 * Set up the search option in the original emoji adder
 */

$(function() {

  var $ae = $('#addemoji');
  var $choose_img = $('.span_1_of_2', $ae).eq(1);

  // Add the search option
  var $search = $('<label for="modesearch" class="radio active right_margin"><input type="radio" name="mode" id="modesearch" value="search">Search for your emoji<br><span class="input_note">Type search queries and we\'ll do our best to find a good match! Powered by Slackmoji.</span><br><br><div id="sm-parent"><div class="sm-hint">&lt;hit enter&gt;</div><input autocomplete="off" type="text" placeholder="Search for emoji..." id="slackmoji"><ul id="slackmoji-results"></ul><br></div></label>')
  $('[for=modedata]', $choose_img).parent().after($search);

  var $sr = $('#slackmoji-results');

  // When we check search, show the searchbox
  $('[name="mode"]').change(function() {
    $('#sm-parent').toggle($('[name="mode"]:checked').val() == 'search');
  });

  // Watch for them to hit enter
  $('#slackmoji').on('keypress', function(event) {
    $('.sm-hint').show();
    if(event.keyCode == 13) {
      $('.slackmoji-active').removeClass('slackmoji-active');
      $sr.removeClass('sm-fade');
      $sr.empty();
      $('.sm-none').remove();
      $('#sm-parent').addClass('sm-loading');
      $('.sm-hint').hide();

      // Do a search
      $.get(base + '/search/' + $(this).val(), function(data) {
        $('#sm-parent').removeClass('sm-loading');

        // Aww, no results...
        if(!Object.keys(data).length) {
          var $p = $('<p>', {'class': 'sm-none'});
          var $center = $('<center>');
          $center.append($('<em>', {text: 'No results'}));
          $p.append($center);
          $sr.before($p);
          return;
        }

        // Loop through the results and add them to the UI
        $.each(data, function(k, img) {
          var $li = $('<li>');
          var $div = $('<div>');
          var $img = $('<img>', {src: img.url, 'data-w': img.width, 'data-h': img.height});
          $div.append($img);
          $li.append($div);
          $sr.append($li);
          $li.click(function() {
            if($(this).hasClass('slackmoji-active')) {
              $('.slackmoji-active').removeClass('slackmoji-active');
              $sr.removeClass('sm-fade');
            } else {
              $('.slackmoji-active').removeClass('slackmoji-active');
              $(this).addClass('slackmoji-active');
              $sr.addClass('sm-fade');
            }
            return false;
          });
        });
      })
      return false;
    }
  });

  // When we submit the form, hijack it if it's "search"
  $ae.submit(function() {
    if($('[name="mode"]:checked').val() != 'search') return;

    utils.uploadEmoji($('.slackmoji-active img', this), $('#emojiname').val(), function(success, data, uri) {
      var $alert = $('.alert', data)
      $('html, body').animate({scrollTop: 0});
      $('.alert').remove();
      $('#page_contents').prepend($alert);
      $('#emoji_inline_preview').css('background-image', 'url('+uri+')').addClass('sm-preview');
      if(success) {
        var $sr = $('#slackmoji-results');
        $('#emojiname').val("");
        $('#slackmoji').val("");
        $sr.empty();
        $sr.removeClass('sm-fade');
      }
    });

    return false;
  });

});

/*
 * BROWSE EMOJIS
 * -------------
 * Set up the search option in the original emoji adder
 */

$(function() {
  var $ae = $('#addemoji');

  // Add the section to the UI
  $ae.before($("<div id='sm-categories'><div id='sm-search-parent'><div id='sm-search-loading'></div><input type='text' id='sm-search' autocomplete='off' placeholder='Search...'></div><h3>Categories</h3><ul id='sm-listcat'></ul><ul id='sm-listemoji'></ul><div class='sm-nothing'>We couldn't find anything! <a href='mailto:gkoberger@gmail.com'>Email us and we can figure this out</a></div><div id='sm-showcats'><a href='#'>View More Categories</a></div><div id='sm-credits'></div></div>"));

  // Get a list of all categories
  $.get(base + '/cats', function(data) {
    $.each(data, function(k, cat) {
      var isImoji = !!cat[2];
      var img = cat[2] || base+'/categories/'+cat[0] +'.png';
      var $li = $('<li>');
      var $imgParent = $('<div>', {'class': 'img-parent'});
      $imgParent.append($('<img>', {src: img}));
      var $strong = $('<strong>', {text: cat[0]});

      $li.append($imgParent);
      $li.append($strong);

      $('#sm-categories ul#sm-listcat').append($li);

      $li.click(function() {
        $(this).addClass('sm-loading');
        utils.fetchList('list' + (isImoji ? '-imoji' : ''), cat);
      });
    });
  });

  // This will expand and show all categories
  $('#sm-showcats a').click(function() {
    $('#sm-listcat').addClass('show-all');
    $(this).parent().remove();
    return false;
  });

  // If they search and hit enter, do a search
  $('#sm-search').on('keypress', function(event) {
    if(event.keyCode == 13) {
      if(!$(this).val()) {
        $('#sm-back').trigger('click')
      } else {
        $('#sm-search-loading').show();
        utils.fetchList('search', [$(this).val()]);
      }
    }
  });

});

var utils = {

  // Gets everything prepared to upload the emoji
  uploadEmoji: ($el, name, cb) => {

    utils.getImageData($el, function(src, w, h) {
      if(src.match(/data:/)) {
        utils._uploadDirect(src, name, $el.closest('li'), cb);
      } else {
        $.post(base + '/resize/', {
          'url': src,
          'width': w,
          'height': h,
        }, function(data) {
          utils._uploadDirect(data.uri, name, $el.closest('li'), cb);
        });
      }
    });

  },

  // Get the image URL, width and height
  getImageData: ($el, fn) => {
    var src = $el.attr('src') || $el.attr('data-original');
    if(!$el.data('h') || $el.data('w')) {
      var img = new Image();
      img.onload = function() {
        fn(src, this.width, this.height);
      }
      img.src = src;
    } else {
      fn(src, $el.data('w'), $el.data('h'));
    }
  },

  // Do the actual uploading of the emoji
  _uploadDirect: (uri, name, $el, cb) => {
    $el.addClass('sm-loading');

    var data = new FormData();

    data.append('add', 1);
    data.append('crumb', $('[name="crumb"]').val());
    data.append('name', name);
    data.append('mode', 'data');
    data.append('img', utils.dataURItoBlob(uri));

    jQuery.ajax({
      url: '/customize/emoji',
      data: data,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST',
      success: function(data) {
        var $alert = $('.alert', data)
        var success = $alert.is('.alert_success');

        if(!success) {

          if(data.match(/There is already an emoji named/)) {
            var id_new = prompt('This emoji name is already taken! What shall we rename it to?', name);
            if(!id_new) return !!($el.removeClass('sm-loading') && false)
            utils._uploadDirect(uri, id_new, $el, cb);
          } else {
            alert('Error uploading!');
          }

        } else {

          $el.addClass('sm-success');
          $el.removeClass('sm-loading');

          // Add the new icon to the list of emojis
          var $er = $('.emoji_row').last();
          var $er_new = $er.clone();
          $er_new.find('.emoji-wrapper').css('background-image', 'url('+uri+')');
          $er_new.find('.emoji-wrapper').css('background-color', 'transparent');
          $er_new.find('td').eq(1).text(':'+name+':');
          $er_new.find('[name=remove]').val(name);
          $er_new.find('.ts_icon').attr('data-emoji-name', name);

          $er_new.css('background-color', '#f7f7c2');

          // Update author information
          var $author = $er_new.find('td.author_cell');
          $('a', $author).attr('href', '/team/' + $('#user_menu_name').text());
          $('.thumb_24', $author).css('background-image', $('#user_menu_avatar .member_preview_link.member_image').css('background-image'));

          try {
            $('a', $author).find("*").addBack().contents().filter(function() {
              return this.nodeType == 3;
            }).remove();
            $('a', $author).append($('<span>', {text: $('#user_menu_name').text()}));
          } catch(e) { }

          $('.emoji_row').last().after($er_new);

        }

        if(cb) return cb(success, data, uri);
      }
    });
  },

  // Convert a URI into a blob so we can upload it
  dataURItoBlob: (dataURI) => {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
  },

  // Remove all the weird characters to make it a slug
  slug: (str) => {
    return str.replace(/\s/g, '-').replace(/[^a-zA-Z0-9-]/g, '').replace(/[0-9]+$/, '');
  },

  // Fetch a list (either a list of categories, or a list of emojis
  fetchList: (folder, cat) => {
    $.get(base + '/'+folder+'/'+cat[0], function(data) {
      $('#sm-listemoji').empty();
      $('#sm-listcat, #sm-showcats').hide();
      $('#sm-search-loading').hide();
      $('#sm-listemoji').show();
      $('#sm-categories h3').empty();
      $('#sm-categories h3').append($('<a>', {href:"#", id:"sm-back", text: 'All Categories'}));
      $('#sm-categories h3').append($('<span>', {text:" » " + cat[0]}));
      $('#sm-credits').toggle(!!cat[1]).empty();
      if (cat[1]) {
        $('#sm-credits').append($('<span>', {text: 'Emojis from '}));
        $('#sm-credits').append($('<a>', {text: cat[1][1], href: cat[1][0]}));
        $('#sm-credits').append($('<span>', {text: '.'}));
        if (cat[1][2]) {
          $('#sm-credits').append($('<span>', {text: ' ' + cat[1][2]}));
        }
      }
      $('#sm-back').click(function() {
        $('.sm-nothing').hide();
        $('#sm-search').val("");
        $('#sm-credits').hide();
        $('.sm-loading').removeClass('sm-loading');
        $('#sm-listemoji').hide();
        $('#sm-listcat, #sm-showcats').show();
        $('#sm-categories h3').text('Categories');
        $('#sm-listcat').scrollTop(0);
        return false;
      });

      if(folder.match(/list/)) {
        $('html, body').animate({
          scrollTop: $('#sm-categories').offset().top - 100,
        });
      }

      if (!Object.keys(data).length) {
        $('.sm-nothing').show();
      } else {
        $.each(data, function(k, img) {
          var id = String(k).replace(/^.*:/, '').replace(/[0-9]+$/, '');
          var $li = $('<li>');
          $li.append($('<div>', {'class': 'sm-add'}));
          var $a = $('<a>', {'href': '#', class:'sm-edit'});
          var $span = $('<span>', {'class': 'sm-edit-text'});
          $span.append($('<i>', {'class': 'ts_icon_pencil ts_icon'}));
          $span.append($('<span>', {'text': ' Edit Name'}));
          $a.append($span);
          $li.append($a);
          $li.append($('<img>', {src: img.url, 'data-w': img.width, 'data-h': img.height, 'data-id': id}));
          $li.append($('<strong>', {text: ':' + id + ':'}));

          $('#sm-categories ul#sm-listemoji').append($li);
          $('.sm-edit', $li).click(function() {
            var $el = $(this).closest('li');
            if($el.is('.sm-loading') || $el.is('.sm-success')) return false;
            var name = prompt('What do you want to call this?', utils.slug($('img', $el).data('id')));
            if(!name) return !!($el.removeClass('sm-loading') && false)
            utils.uploadEmoji($('img', $el), name);
            return false;
          });
          $li.click(function() {
            var $el = $(this);
            if($el.is('.sm-loading') || $el.is('.sm-success')) return;
            utils.uploadEmoji($('img', this), $('img', this).data('id'));
          });

        });
        $('.sm-nothing').hide();
      }
    });
  },

  // Turn a :emoji-name: into an "Emoji Name"
  toTitleCase: (str) => {
    return str.replace(/owlbert-/, '').replace(/-/g, ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },

};

/*
 * Set up AJAX
 */

$.ajaxSetup({
  headers: {
    'refer': window.location.host,
  }
});

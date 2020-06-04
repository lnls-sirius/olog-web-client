/*
 * Functions common to complete application
 *
 * @author: Dejan Dežman <dejan.dezman@cosylab.com>
 */

$(document).ready(function(){

	// Write data from cookie back to object and remove cookie
	if($.cookie(filtersCookieName) !== undefined) {
		selectedElements = $.parseJSON($.cookie(filtersCookieName));
	}

	// Read data from settings cookie and set it to ologSettings object
	if($.cookie(settingsCookieName) !== undefined) {
		ologSettings = $.parseJSON($.cookie(settingsCookieName));

	} else {
		// Set includeHistory
		ologSettings.includeHistory = includeHistory;

        // Set include StartDate
        ologSettings.includeStartDate = includeStartDate;

        // Set include Description
        ologSettings.includeLogDescription = includeLogDescription;

        //Set include Attachments
		ologSettings.includeLogAttachment = includeLogAttachment;

		// Set logVersionOrder
		ologSettings.logVersionOrder = logVersionOrder;
	}

	// Set version number
	$('.version').html("v" + version);

	// Create new comparator
	jQuery.expr[':'].Contains = function(a, i, m) {
		return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
	};

	// Create selector for searching for exact text value
	jQuery.expr[':'].textEquals = function(a, i, m) {
		return $(a).text().match("^" + m[3] + "$");
	};

	var urlObject = $['url']();

	// Get reason from url
	var reason = urlObject.param("reason");

	if(reason !== undefined) {
		$('#top_container').toggleClass("open");

		$('.user_dropdown_menu').ready(function(){
			$('#user_username').focus();
		});
	}

	// Get id and show Log user is interested in
	var id = urlObject.attr("anchor");

	if(id !== undefined) {
		selectedLog = id;
	}

	// Delete cookie when Olog resizes
	$(window).resize(function(e){
        resizeWithCollapse();
		if($.cookie(settingsCookieName) !== undefined && ologSettings.resize !== undefined) {

			//Reset whole cookie
			//$.removeCookie(settingsCookieName);

			//Reset the resize obj of the cookie
            ologSettings.resize = undefined;
			saveOlogSettingsData(ologSettings);

            l("RELOAD");
            setTimeout(function(){
                window.location.reload();
            },25);
		}
	});

	// Hide Logbooks for small screens
	$('#load_logbooks').on('dataloaded', function(e){
		if($(window).width() < smallScreenResolutionWidth) {
			closeFilterGroup($('#load_logbooks'));
		}
	});

    // Hide Shortcuts for small screens
    $('#load_shortcuts').on('dataloaded', function(e){
        if($(window).width() < smallScreenResolutionWidth) {
            closeFilterGroup($('#load_shortcuts'));
        }
    });

	// Hide Tags for small screens
	$('#load_tags').on('dataloaded', function(e){
		if($(window).width() < smallScreenResolutionWidth) {
			closeFilterGroup($('#load_tags'));
		}
	});

	// Hide time filter from
	$('#load_time_from').on('dataloaded', function(e){
		if($(window).width() < smallScreenResolutionWidth) {
			closeFilterGroup($('#load_time_from'));
		}
	});

	// If Olog is opened on small screen resolution, close filters, disable
	// adding and editing.
	if($(window).width() < smallScreenResolutionWidth) {
		closeFilterGroup($('#load_from_to_chevron'));
	}

	// Start listening for expand/collapse filters
	startListeningForToggleFilterClicks();
});

/**
 * Initialize pans resize listener.
 *
 * Check if we have dimensions already saved in a cookie and set widths. If dimensions
 * are not saved, created new dimension object and fill it with current dimensions.
 */
function resizeManager() {
	var leftPane = ".container-left";
	var middlePane = ".container-middle";
	var rightPane = ".container-right";
	var modifyLeftPane = ".container-modify-left";
	var modifyRightPane = ".container-modify-right";

	var multilistCollapse = $('#min-multilists');

	// Resize left and middle section
	$('.container-resize').draggable({axis: "x"});

	// Resize middle and right section
	$('.container-resize2').draggable({axis: "x"});

	// Resize middle and right section
	$('.container-resize3').draggable({axis: "x"});

	var dims = null;

	var windowWidth = $(window).width();
	var minWidth = Math.round(windowWidth * 0.1);

	// If cookie is not set, create new dims object
	if(ologSettings.resize === undefined) {
		//l("new dims");

		dims = {
			left_pane_width: undefined,
			middle_pane_left: undefined,
			middle_pane_width: undefined,
			right_pane_left: undefined,
			right_pane_width: undefined,

			modify_left_pane_left: undefined,
			modify_left_pane_width: undefined,
			modify_right_pane_left: undefined,
			modify_right_pane_width: undefined
		};

		//ologSettings.resize = dims;

		// Set the rest of the sizes so we don't get into trouble
		/*if($(middlePane).doesExist()){
			var middlePaneWidth = $(middlePane).width();

			dims.middle_pane_width = middlePaneWidth;
			dims.right_pane_width = windowWidth - dims.left_pane_width - middlePaneWidth;
			dims.right_pane_left = dims.left_pane_width + middlePaneWidth;

		// New modify layout, set sizes
		} else {
			dims.modify_left_pane_left = 0;
			dims.modify_left_pane_width = $(modifyLeftPane).width();
			dims.modify_right_pane_left = dims.modify_left_pane_width;
			dims.modify_right_pane_width = $(modifyRightPane).width();
		}*/

	// If settings cookie is set, read and set the panes' dimensions
	} else {
		dims = ologSettings.resize;
		l(dims);

		$(leftPane).width(dims.left_pane_width);
		$(middlePane).css({left: dims.middle_pane_left});
		$(middlePane).width(dims.middle_pane_width);
		$(rightPane).css({left: dims.right_pane_left});
		$(rightPane).width(dims.right_pane_width);

		$(modifyLeftPane).css({left: dims.modify_left_pane_left});
		$(modifyLeftPane).width(dims.modify_left_pane_width);
		$(modifyRightPane).css({left: dims.modify_right_pane_left});
		$(modifyRightPane).width(dims.modify_right_pane_width);

		$('.container-resize').css({left: dims.middle_pane_left});
		$('.container-resize2').css({left: dims.right_pane_left});
		$('.container-resize3').css({left: dims.modify_right_pane_left});

	}

	// Drag left resizer
	$('.container-resize').on('drag', function(e){
		dims.left_pane_width = $(leftPane).width();
		dims.middle_pane_left = dims.left_pane_width;

		//l(dims);

		var oldWidth = $(leftPane).width();

		// Limit the minimal width of the left pane
		if(oldWidth < minWidth && e.pageX < dims.left_pane_width) {
			return;
		}

		// Limit the minimal width of the middle pane
		if(dims.middle_pane_width < minWidth && e.pageX > dims.middle_pane_left) {
			return;
		}

        //set the multilist collapse
        multilistCollapse.css('left', e.pageX - multilistCollapse.width());

		var diff = oldWidth - e.pageX;

		$(leftPane).width(e.pageX);
		dims.left_pane_width = e.pageX;

		$(middlePane).css({left: e.pageX});
		dims.middle_pane_left = e.pageX;

		// If middle pane exists, repair its width
		$(middlePane).width($(middlePane).width() + diff);
		dims.middle_pane_width = $(middlePane).width() + diff;

        $(rightPane).width($(window).width() - dims.right_pane_left);
        dims.right_pane_width = $(window).width() - dims.right_pane_left;

		ologSettings.resize = dims;
		saveOlogSettingsData(ologSettings);
	});

	// Stop dragging left resizer
	$('.container-resize').on('dragstop', function(e){
		$('.container-resize').css({left: dims.left_pane_width});
	});

	// Drag right resizer
	$('.container-resize2').on('drag', function(e){
		dims.left_pane_width = $(leftPane).width();

		if(ologSettings.collapse_multilist){
            dims.middle_pane_left = 0;

            //limit the size
            if($(middlePane).width() + 10 < dims.left_pane_width + minWidth && e.pageX < dims.middle_pane_width){
				return;
			}

		}else{
            dims.middle_pane_left = dims.left_pane_width;
        }

		//l(dims);

		// Limit the minimal width of the middle pane
		if($(middlePane).width() < minWidth && e.pageX < dims.middle_pane_left + dims.middle_pane_width) {
			return;
		}

		// Limit the minimal width of the right pane
		if($(rightPane).width() < minWidth && e.pageX > dims.right_pane_left) {
			return;
		}

		$(middlePane).width(e.pageX - dims.middle_pane_left);
		dims.middle_pane_width = e.pageX - dims.middle_pane_left;

		$(rightPane).css({left: e.pageX});
		dims.right_pane_left =  e.pageX;

		$(rightPane).width($(window).width() - dims.right_pane_left);
		dims.right_pane_width = $(window).width() - dims.right_pane_left;

		//l(dims.right_pane_width + '|' + dims.right_pane_left);

		ologSettings.resize = dims;
		saveOlogSettingsData(ologSettings);
	});

	// Stop dragging left resizer
	$('.container-resize2').on('dragstop', function(e){
		$('.container-resize2').css({left: dims.right_pane_left});
	});

	// Drag new resizer in create/modify layout
	$('.container-resize3').on('drag', function(e){
		//l(dims);

		var oldWidth = $(modifyLeftPane).width();

		// Limit the minimal width of the left pane
		if(oldWidth < minWidth && e.pageX < dims.modify_left_pane_width) {
			return;
		}

		// Limit the minimal width of the right pane
		if(dims.modify_right_pane_width < minWidth && e.pageX > dims.modify_right_pane_left) {
			return;
		}


        //set the multilist collapse
        multilistCollapse.css('left', e.pageX);

		var diff = oldWidth - e.pageX;

		$(modifyLeftPane).width(e.pageX);
		dims.modify_left_pane_width = e.pageX;

		$(modifyRightPane).css({left: e.pageX});
		dims.modify_right_pane_left = e.pageX;

		// If middle pane exists, repair its width
		$(modifyRightPane).width($(modifyRightPane).width() + diff);
		dims.modify_right_pane_width = $(modifyRightPane).width() + diff;

		ologSettings.resize = dims;
		saveOlogSettingsData(ologSettings);
	});

	// Stop dragging new resizer
	$('.container-resize3').on('dragstop', function(e){
		$('.container-resize3').css({left: dims.modify_right_pane_left});
	});
}

/**
 * Replace special characters in strings that should not contain them
 * @param {type} input input string
 * @returns {string} replaced input string
 */
function prepareInput(input) {
	return input.replace(/[^a-z0-9]/ig, "");
}

/**
 * Remove html tags from input string
 * @param {type} input input string
 * @returns {string} replaced string
 */
function removeHtmlTags(input) {
	return input.replace(/<.*?>/ig, "");
}

/**
 * Disable creating new Logs, Logbooks, Tags and mofidying them
 */
function disableCreatingNewAndModifying() {
	$('#add_btn_group').css("z-index", "-1");
	$('#new_log').addClass("disabled");
	$('#new_log').attr("disabled", true);
	$('#new_logbook_and_tag').addClass("disabled");
	$('#new_logbook_and_tag').attr("disabled", true);
	$('#modify_log_link').hide();
	$('#delete_log_link').hide();
	$('#new_logbook_multilist').hide().attr("disabled", true);
	$('#new_tag_multilist').hide().attr("disabled", true);
    $('.log-opt-btn.edit-log-btn').hide();
}

/**
 * Enable creating Logs, Logbooks, Tags and modifying them
 */
function enableCreatingAndModifying() {
	$('#add_btn_group').css("z-index", "5");
	$('#new_log').removeClass("disabled");
	$('#new_log').attr("disabled", false);
	$('#new_logbook_and_tag').removeClass("disabled");
	$('#new_logbook_and_tag').attr("disabled", false);
    $('#modify_log_link').show();
    $('#delete_log_link').show();
    $('#new_logbook_multilist').show().attr("disabled", false);
    $('#new_tag_multilist').show().attr("disabled", false);
    $('.log-opt-btn.edit-log-btn').show();
}

/**
 * Save filter data into a cookie
 * @param {type} dataToBeSaved object to be saved into a cookie
 */
function saveFilterData(dataToBeSaved) {
	l("save filters data");
	l(dataToBeSaved);
	showHideSearchCleanButton($('#search-query'));
	$.cookie(filtersCookieName, JSON.stringify(dataToBeSaved));
}

/**
 * Delete filter cookie when user presses clean filters button
 */
function deleteFilterData() {
	$.removeCookie(filtersCookieName);
    ologSettings.searchInputElements = undefined;
    saveOlogSettingsData(ologSettings);
}

/**
 *
 * @param {type} rawId id of the first child element
 * @param {type} element type of the filter (logbooks or tags)
 */
function toggleChildren(rawId, element){
	l("toggle children");
	//var rawId = $(e.target).find('input[name=raw_id]').val();
	l(rawId);

	l($($('.child_' + rawId)[0]).is(":visible"));

	var infoElement = $(element).find("span");
	var iconElement = $(element).find("i");

	if($('.child_' + rawId).is(":hidden")) {
		infoElement.text("Hide history");
		iconElement.removeClass("glyphicon-chevron-right");
		iconElement.addClass("glyphicon-chevron-down");

	} else {
		infoElement.text("Show history");
		iconElement.removeClass("glyphicon-chevron-down");
		iconElement.addClass("glyphicon-chevron-right");
	}

	// Slide up items that does not contain filters and are not selected
	$('.child_' + rawId).slideToggle();
}

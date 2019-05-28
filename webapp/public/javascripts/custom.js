$(document).ready(function(){


  $(".submenu > a").click(function(e) {
    e.preventDefault();
    var $li = $(this).parent("li");
    var $ul = $(this).next("ul");

    if($li.hasClass("open")) {
      $ul.slideUp(350);
      $li.removeClass("open");
    } else {
      $(".nav > li > ul").slideUp(350);
      $(".nav > li").removeClass("open");
      $ul.slideDown(350);
      $li.addClass("open");
    }
  });

  /*Lender Entrance Screen URL*/
  $("#lender").attr("href", "/lender/mycredits");
  /*Borrower Entrance Screen URL*/
  $("#borrower").attr("href", "/borrower/myloans");
  /*Merchant Entrance Screen URL*/
	$("#merchant").attr("href", "/merchant/mycredits");

  $('#icondemo').filestyle({
				iconName : 'glyphicon glyphicon-file',
				buttonText : 'Select File',
        buttonName : 'btn-info'
			});

});

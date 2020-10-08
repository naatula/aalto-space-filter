// ==UserScript==
// @name         Aalto Space Filter
// @namespace    https://simonaatula.fi/
// @version      0.1.1
// @description  Makes Aalto Space reservations easier by hiding non-bookable spaces
// @author       Simo Naatula
// @updateURL    https://github.com/naatula/aalto-space-filter/raw/master/aalto-space-filter.user.js
// @match        https://booking.aalto.fi/aaltospace/*
// @grant        none
// ==/UserScript==
/* global $ */

(function(){
    let lang = 0;
    let count = 0;
    $('.col-sm-4.col-lg-4.col-md-4').each(function(){
        let text = $(this).find($('.ratings .pull-right'))[0].innerText.match(/not bookable|ei varattavissa/);
        if(text != null){
            if(!count && text.includes('ei varattavissa')){ lang = 1; }
            $(this).addClass('hidden non-bookable');
            $(this).appendTo($(this).parent());
            count++;
        }
    });
    if(count){
        let btn = [`Show ${count} non-bookable spaces`, `Näytä ${count} ei-varattavaa tilaa`][lang];
        $('.container .row .col-md-9').append(`<a class='btn'>${btn}</a>`).children().last().click(function(){
            $(this).addClass('hidden');
            $('.non-bookable').each(function(){ $(this).removeClass('hidden'); });
        });
    }
})();

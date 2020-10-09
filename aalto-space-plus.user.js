// ==UserScript==
// @name         Aalto Space Plus
// @namespace    https://simonaatula.fi/
// @version      0.4.1
// @description  Makes browsing Aalto Space easier
// @author       Simo Naatula
// @updateURL    https://github.com/naatula/aalto-space-plus/raw/master/aalto-space-plus.user.js
// @match        https://booking.aalto.fi/aaltospace/*
// @grant        none
// ==/UserScript==
/* global $ */

(function(){
  function isReservable(card){
    return !card.find('.ratings .pull-right')[0].innerText.includes(',')
  }

  let query = window.location.search
  if(query.includes('page=building') && !query.includes('room_id=')){
    let languageString = new URLSearchParams($('nav.navbar .container ul.nav.navbar-nav.pull-right li.active a')[0].href).get('language')
    let lang = 0
    if(languageString == 'fin'){ lang = 1 }
    if(query.includes('floor_id=')){
      let count = 0
      $('.col-sm-4.col-lg-4.col-md-4').each(function(){
        let card = $(this)
        if(!isReservable(card)){
          card.addClass('hidden non-bookable')
          card.appendTo($(this).parent())
          count++
        }else if(card.find('.stat-label-inuse').length > 0){
          let link = card.find('a')[0].href
          $.get(link, function(data){
            card.find('.ratings .pull-right')[0].innerText =
              $(data).find('.col-md-9 .ratings .pull-right')[0].innerText.split(' / ').reverse().join(' / ')
          })
        }
      })
      if(count){
        let btn = [`Show ${count} non-bookable spaces`, `Näytä ${count} ei-varattavaa tilaa`][lang]
        $('.container .row .col-md-9').append(`<a class='btn'>${btn}</a>`).children().last().click(function(){
          $(this).addClass('hidden')
          $('.non-bookable').each(function(){ $(this).removeClass('hidden') })
        })
      }
    } else {
      $('.col-sm-4.col-lg-4.col-md-4').each(function(){
        let card = $(this)
        let link = card.find('a')[0].href
        $.get(link, function(data){
          let spaces = new Map();
          ['free','inuse','booked'].forEach(function(status){
            spaces.set(status, $(data).find('.col-sm-4.col-lg-4.col-md-4').filter(function(index){
              return (isReservable($(this)) && $(this).find('.caption .stat-label-' + status).length > 0)
            }).size())
            card.find('.stat-label-' + status + ' .stat-label')[0].innerText = spaces.get(status)
          })
          let text = ['No bookable spaces', 'Ei varattavia tiloja'][lang]
          let textElement = card.find('.ratings .pull-right')[0]
          let count = spaces.get('free') + spaces.get('inuse')
          if(count){
            $(textElement).css('color', 'green')
            if(count > 1){ text = [`${count} spaces available`, `${count} tilaa käytettävissä`][lang] }
            else { text = [`${count} space available`, `${count} tila käytettävissä`][lang] }
          }
          textElement.innerText = text
        })
      })
    }
  }
})()

// ==UserScript==
// @name         Aalto Space Plus
// @namespace    https://simonaatula.fi/
// @version      0.2
// @description  Makes Aalto Space reservations easier by hiding non-bookable spaces
// @author       Simo Naatula
// @updateURL    https://github.com/naatula/aalto-space-plus/raw/master/aalto-space-plus.user.js
// @match        https://booking.aalto.fi/aaltospace/*
// @grant        none
// ==/UserScript==
/* global $ */

(function(){
  let query = window.location.search
  if(query.includes('page=building') && !query.includes('room_id=')){
    let languageString = new URLSearchParams($('nav.navbar .container ul.nav.navbar-nav.pull-right li.active a')[0].href).get('language')
    let lang = 0
    if(languageString == 'fin'){ lang = 1 }
    if(query.includes('floor_id=')){
      let count = 0
      $('.col-sm-4.col-lg-4.col-md-4').each(function(){
        let card = $(this)
        let nonBookable = $(this).find($('.ratings .pull-right'))[0].innerText.includes(',')
        if(nonBookable){
          $(this).addClass('hidden non-bookable')
          $(this).appendTo($(this).parent())
          count++
        }else if(card.find('.stat-label-inuse').length > 0){
          let link = card.find('a')[0].href
          $.get(link, function(data){
            card.find('.ratings .pull-right')[0].innerText = $(data).find('.col-md-9 .ratings .pull-right')[0].innerText.split(' / ').reverse().join(' / ')
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
        let floor = $(this)
        let link = floor.find('a')[0].href
        $.get(link, function(data){
          let count = $(data).find('.col-sm-4.col-lg-4.col-md-4').filter(function(index){ return (!$(this).find('.ratings .pull-right')[0].innerText.includes(',') && $(this).find('.caption .stat-label-booked').length == 0) }).size()
          let text = ['No bookable spaces', 'Ei varattavia tiloja'][lang]
          let textElement = floor.find('.ratings .pull-right')[0]
          if(count){
            $(textElement).css('color', 'green')
            if(count > 1){ text = [`${count} spaces available`, `${count} tilaa saatavilla`][lang] }
            else { text = [`${count} bookable space`, `${count} varattava tila`][lang] }
          }
          textElement.innerText = text
        })
      })
    }
  }
})()

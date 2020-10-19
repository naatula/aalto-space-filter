// ==UserScript==
// @name         Aalto Space Plus
// @namespace    https://simonaatula.fi/
// @version      0.5.1
// @description  Makes browsing Aalto Space easier
// @author       Simo Naatula
// @updateURL    https://github.com/naatula/aalto-space-plus/raw/master/aalto-space-plus.user.js
// @match        https://booking.aalto.fi/aaltospace/*
// @grant        none
// ==/UserScript==
/* global $ */

(function(){

  const spaceTypes = new Map([
    ['A034 R001', 2],
    ['M134 R001', 2],
    ['M233 R001', 1],
    ['M234 R001', 1],
    ['U250a R001', 2],
    ['U264 R001', 2],
    ['U358 R001', 2],
    ['U405a R001', 1],
    ['U406a R001', 2],
    ['U406b R001', 2],
    ['Y228a R001', 2],
    ['Y228b R001', 2],
    ['Y229a R001', 2],
    ['Y229c R001', 2],
    ['Y307 R001', 2],
    ['Y307a R001', 2],
    ['Y308 R001', 1],
    ['Y309b R001', 1],
    ['Y313 R001', 1],
    ['M322 R001', 1],
    ['Y346 R001', 2],
    ['Y405 R001', 1],
    ['M102 R028', 2],
    ['A133 R030', 2],
    ['C206 R030', 2],
    ['2006 R037', 1],
    ['A302 R011', 2],
    ['C301 R011', 1],
    ['D311 R011', 2],
    ['201 R008', 1],
    ['202 R008', 2],
    ['214 R008', 2],
    ['106 R015', 3],
    ['107 R015', 3],
    ['108 R015', 3],
    ['109 R015', 3],
    ['113 R015', 2],
    ['204 R015', 1]])

  function getSpaceType(id, buildingId = new URLSearchParams(window.location.search).get('building_id')){
    let r = spaceTypes.get(`${id} ${buildingId}`)
    if(r == null){ return 0 } else { return r }
  }

  function isReservable(card){
    return !card.find('.ratings .pull-right')[0].innerText.includes(',')
  }

  function setFooter(){
    $('footer').css('margin-bottom', '50px')
    $('footer .col-lg-12 div')[0].innerHTML = '<a class="btn btn-default" href="https://github.com/naatula/aalto-space-plus/" target="_blank"><samp>Aalto Space Plus</samp></a>'
  }

  function applyGridStyles(){
    $('head').append(`
    <style>
    .container .row .col-md-9 .row {
      display: grid;
      grid-template-columns: 1fr;
    }
    .container .row .col-md-9 .row::before, .container .row .col-md-9 .row::after {
      content: none;
    }
    .container .row .col-md-9 .row .col-sm-4.col-lg-4.col-md-4 {
      width: 100%;
      min-width: 0;
    }
    .container .row .col-md-9 .row .col-sm-4.col-lg-4.col-md-4 .thumbnail .caption {
      height: auto;
    }
    @media (min-width: 768px) {
      .container .row .col-md-9 .row {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
    </style>
    `)
  }

  function spaceList(){
    let count = 0
    let content = $('.container .row .col-md-9')
    content.append($(`<h4 class="non-bookable hidden">${['Not bookable', 'Ei varattavissa'][lang]}</h4>`))
    let nonBookables = $('<div class="non-bookable row hidden"></div>')
    content.append(nonBookables)
    $('.col-sm-4.col-lg-4.col-md-4').each(function(){
      let card = $(this)
      addTagToCard(card)
      if(!isReservable(card)){
        card.addClass('non-bookable')
        card.appendTo(nonBookables)
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
      $('.container .row .col-md-9').append(`<a class='btn btn-link'>${btn}</a>`).children().last().click(function(){
        $(this).addClass('hidden')
        $('.non-bookable').each(function(){ $(this).removeClass('hidden') })
      })
    }
  }

  function addTagToCard(card){
    let line = card.find('h4 + p')
    let id = line.text().split(' ')[0]
    let type = getSpaceType(id)
    if(type > 0){
      line.append('<br>' + tagGenerator(type))
    }
  }

  function tagGenerator(type, count = 0){
    let string = [['Other','Muu'], ['Silent','Hiljainen'], ['Shared','Jaettu'], ['Group','Ryhmätyö'],][type][lang]
    let color = ["555","753bbd","286090","3c763d"][type]
    if(count){
      return ` <span class="badge" style="font-weight: inherit; background: #${color};">${count} ⨯ ${string}</span>`
    } else {
      return ` <span class="badge" style="font-weight: inherit; background: #${color};">${string}</span>`
    }
  }

  function floorList(){
    $('.col-sm-4.col-lg-4.col-md-4').each(function(){
      let card = $(this)
      let link = card.find('a')[0].href
      $.get(link, function(data){
        let spaceCards = $(data).find('.col-sm-4.col-lg-4.col-md-4')
        let spaces = new Map();
        ['free','inuse','booked'].forEach(function(status){
          spaces.set(status, spaceCards.filter(function(index){
            return (isReservable($(this)) && $(this).find('.caption .stat-label-' + status).length > 0)
          }).size())
          card.find('.stat-label-' + status + ' .stat-label')[0].innerText = spaces.get(status)
        })

        let text = ['No available spaces', 'Ei tiloja saatavilla'][lang]
        card.find('.ratings').html('<p></p>')
        let textElement = card.find('.ratings p')[0]
        $(textElement).css('height', '3em')
        var availableCounts = []
        spaceCards.filter(function(index){
          let type = getSpaceType($(this).find('h4 + p').text().split(' ')[0])
          if(isReservable($(this))){
            availableCounts[type] = (availableCounts[type] || 0) + 1
          }
        })
        if(availableCounts.length == 0){
          textElement.innerText = text
        } else {
          availableCounts.forEach(function(value, index){
            $(textElement).prepend(tagGenerator(index, value))
          })
        }
      })
    })
  }

  function spacePage(){
    let line = $('.caption-full > h4 + p')
    let type = getSpaceType(line.text().split(' ')[0])
    if(type > 0){
      line.append(tagGenerator(type))
    }
  }

  function buildingList(){
    $('.col-sm-4.col-lg-4.col-md-4').each(function(){
      let card = $(this)
      let line = card.find('.caption p')
      var building = new URLSearchParams(card.find('a')[0].href).get('building_id')
      var existingTypes = []
      spaceTypes.forEach(function(v,k){
        if(k.split(' ')[1] == building){
          existingTypes[v] = true
        }
      })
      if(existingTypes.length){
        let tags = $('<p></p>')
        line.after(tags)
        existingTypes.forEach(function(type, index){
          tags.append(tagGenerator(index))
        })
      } else {
        card.parent().append(card)
      }
    })
  }

  setFooter()
  applyGridStyles()
  let query = window.location.search
  let languageString = new URLSearchParams($('nav.navbar .container ul.nav.navbar-nav.pull-right li.active a')[0].href).get('language')
  var lang = 0
  if(languageString == 'fin'){ lang = 1 }
  if(query.includes('page=building')){
    if(query.includes('room_id=')){
      spacePage()
    } else if(query.includes('floor_id=')){
      spaceList()
    } else {
      floorList()
    }
  } else if(['/aaltospace/', '/aaltospace/index.php'].includes(window.location.pathname)){
    buildingList()
  }
})()

// ==UserScript==
// @name         Aalto Space Plus
// @namespace    https://simonaatula.fi/
// @version      0.5.9
// @description  Makes browsing Aalto Space easier
// @author       Simo Naatula
// @updateURL    https://github.com/naatula/aalto-space-plus/raw/master/aalto-space-plus.user.js
// @match        https://booking.aalto.fi/aaltospace/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      simonaatula.fi
// @connect      github.com
//
// ==/UserScript==
/* global $ */

(function(){

  function updateAndRunMain(){
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://simonaatula.fi/dev/aalto-space-types.json',
      onload: function(response) {
        try {
          let json = JSON.parse(response.responseText)
          if(json.version == 1){
            GM_setValue('updated', (new Date()).toDateString())
            GM_setValue('types', json.data);
            spaceTypes = json.data
          } else {
            console.log('Version mismatch')
          }
          main()
        } catch(e) {
          console.log('Update failed')
          main()
        }
      }
    })
  }

  function getSpaceType(id, buildingId = new URLSearchParams(window.location.search).get('building_id')){
    let r = spaceTypes[`${id} ${buildingId}`]
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
    .container > .row > .col-md-9 > .row {
      display: grid;
      grid-template-columns: 1fr;
    }
    .container > .row > .col-md-9 > .row::before, .container > .row > .col-md-9 > .row::after {
      content: none;
    }
    .container > .row > .col-md-9 > .row > .col-sm-4.col-lg-4.col-md-4 {
      width: 100%;
      min-width: 0;
    }
    .container > .row > .col-md-9 > .row > .col-sm-4.col-lg-4.col-md-4 > .thumbnail > .caption {
      height: auto;
    }
    @media (min-width: 768px) {
      .container > .row > .col-md-9 > .row {
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
    line.css('max-height', 'none')
    let id = line.text().split(' ')[0]
    let type = getSpaceType(id)
    if(type > 0){
      line.append('<br>' + tagGenerator(type))
    }
  }

  function tagGenerator(type, count = -1){
    let string = [['Other','Muu'], ['Silent','Hiljainen'], ['Shared','Jaettu'], ['Group','Ryhmätyö'],][type][lang]
    let color = ['555','753bbd','286090','3c763d'][type]
    if(count==0){
      color = 'bbb'
    }
    if(count > -1){
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

        let text = ['No reservable spaces', 'Ei varattavia tiloja'][lang]
        card.find('.ratings').html('<p></p>')
        let textElement = card.find('.ratings p')[0]
        $(textElement).css('height', '3em')
        var availableCounts = []
        spaceCards.each(function(index){
          let type = getSpaceType($(this).find('h4 + p').text().split(' ')[0])
          if(isReservable($(this)) && $(this).find('.caption .stat-label-booked').length == 0){
            availableCounts[type] = (availableCounts[type] || 0) + 1
          } else if(type) {
            availableCounts[type] = availableCounts[type] || 0
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
      Object.entries(spaceTypes).forEach(function(arr){
        let k = arr[0]
        let v = arr[1]
        if(k.split(' ')[1] == building){
          existingTypes[v] = true
        }
      })
      if(existingTypes.length){
        let tags = $('<p></p>')
        line.after(tags)
        existingTypes.forEach(function(type, index){
          tags.prepend(tagGenerator(index))
        })
      } else {
        card.parent().append(card)
      }
    })
  }

  function main(){
    let query = window.location.search
    let languageString = new URLSearchParams($('nav.navbar .container ul.nav.navbar-nav.pull-right li.active a')[0].href).get('language')
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
  }

  setFooter()
  applyGridStyles()

  var lang = 0
  let spaceTypes = GM_getValue('types', {})
  if((new Date()).toDateString() != GM_getValue('updated')){
    updateAndRunMain()
  } else {
    main()
  }

})()

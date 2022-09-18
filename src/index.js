// TODO implement card drag-and-dropping
// TODO maybe cache scaffolding information?

const {hyphenateSync} = require('hyphen/en')

const cardList = document.querySelector('.spell-card-list');

// region card selection
let selectedCard = null
let resizeObserver = new ResizeObserver(entries => {
    const expansion = selectedCard.querySelector('.expansion')
    const wrapper = expansion.querySelector('.height-measuring-wrapper')
    expansion.style.setProperty('transition-duration', `${Math.max(0.2, Math.ceil(wrapper.getBoundingClientRect().height) * 0.001)}s`)
    expansion.style.setProperty('height', `${Math.ceil(wrapper.getBoundingClientRect().height)}px`)
})

function toggleCardSelection(card) {
    const oldCard = selectedCard
    const newCard = selectedCard === card ? null : card
    if (oldCard) {
        oldCard.classList.remove('selected')
        resizeObserver.disconnect()
        const expansion = oldCard.querySelector('.expansion')
        expansion.style.removeProperty('height')
        setTimeout(() => expansion.style.removeProperty('transition-duration'),
            parseFloat(expansion.style.transitionDuration.slice(0, -1)) * 1000)
    }
    if (newCard) {
        newCard.classList.add('selected')
        const expansion = newCard.querySelector('.expansion')
        const wrapper = expansion.querySelector('.height-measuring-wrapper')
        expansion.style.setProperty('transition-duration', `${Math.ceil(wrapper.getBoundingClientRect().height) * 0.001}s`)
        expansion.style.setProperty('height', `${Math.ceil(wrapper.getBoundingClientRect().height)}px`)
        resizeObserver.observe(wrapper)
    }
    selectedCard = newCard
}

// endregion

let allSpellCards

console.timeStamp("starting fetching")
if (currentMode() === 'castable')
    prepareCastable()
else if (currentMode() === 'all')
    prepareAll()
fetch("../data/effects.json").then(response => response.json()).then(json => {
    allSpellCards = Object
        .entries(json)
        .flatMap(([level, spells]) => spells.map(spell => ({
            ...spell,
            'level': level
        })))
    console.timeStamp("done fetching")
    if (currentMode() === 'castable')
        loadCastable()
    else if (currentMode() === 'all')
        loadAll()
});

function currentMode() {
    let mode = localStorage.getItem('mode')
    if (mode === null) {
        mode = 'all'
        setMode(mode)
    }
    return mode
}

function setMode(mode) {
    localStorage.setItem('mode', mode)
}

function markChosen(spellName) {
    localStorage.setItem(spellName + ' castability', 'chosen')
}

function markKnown(spellName) {
    localStorage.setItem(spellName + ' castability', 'known')
}

function markPrepared(spellName) {
    localStorage.setItem(spellName + ' castability', 'prepared')
}

function unmarkCastable(spellName) {
    localStorage.removeItem(spellName + ' castability')
}

function markFavoriteSpell(spellName) {
    localStorage.setItem(spellName + ' favorite spell', 'true')
}

function unmarkFavoriteSpell(spellName) {
    localStorage.removeItem(spellName + ' favorite spell')
}

function markFavorite(cardName) {
    localStorage.setItem(cardName + ' favorite', 'true')
}

function unmarkFavorite(cardName) {
    localStorage.removeItem(cardName + ' favorite')
}

function isChosen(spellName) {
    return localStorage.getItem(spellName + ' castability') === 'chosen'
}

function isKnown(spellName) {
    return localStorage.getItem(spellName + ' castability') === 'known'
}

function isPrepared(spellName) {
    return localStorage.getItem(spellName + ' castability') === 'prepared'
}

function isFavoriteSpell(spellName) {
    return localStorage.getItem(spellName + ' favorite spell') === 'true'
}

function isFavorite(cardName) {
    return localStorage.getItem(cardName + ' favorite') === 'true'
}

let cardsBySpellName = {}
let cardsByCardName = {}

function spellNameOf(card) {
    return card['name'];
}

function isCastable(card) {
    let spellName = spellNameOf(card)
    return isChosen(spellName) || isKnown(spellName) || isPrepared(spellName)
}

function toggleChosen(card) {
    const spellName = spellNameOf(card)
    if (isChosen(spellName)) {
        unmarkCastable(spellName)
        if (currentMode() === 'castable')
            cardsBySpellName[spellName].remove()
        else
            cardsBySpellName[spellName].classList.remove('chosen')
    } else {
        markChosen(spellName)
        cardsBySpellName[spellName].classList.add('chosen')
    }
}

function toggleKnown(card) {
    const spellName = spellNameOf(card)
    if (isKnown(spellName)) {
        unmarkCastable(spellName)
        if (currentMode() === 'castable')
            cardsBySpellName[spellName].remove()
        else
            cardsBySpellName[spellName].classList.remove('known')
    } else {
        if (isPrepared(spellName)) {
            cardsBySpellName[spellName].classList.remove('prepared')
        }
        markKnown(spellName)
        cardsBySpellName[spellName].classList.add('known')
    }
}

function togglePrepared(card) {
    const spellName = spellNameOf(card)
    if (isPrepared(spellName)) {
        unmarkCastable(spellName)
        if (currentMode() === 'castable')
            cardsBySpellName[spellName].remove()
        else
            cardsBySpellName[spellName].classList.remove('prepared')
    } else {
        if (isKnown(spellName)) {
            cardsBySpellName[spellName].classList.remove('known')
        }
        markPrepared(spellName)
        cardsBySpellName[spellName].classList.add('prepared')
    }
}

function toggleFavoriteSpell(card) {
    const cardName = card['name']
    if (isFavoriteSpell(cardName)) {
        unmarkFavoriteSpell(cardName)
        cardsBySpellName[cardName].classList.remove('favorite')
    } else {
        markFavoriteSpell(cardName)
        cardsBySpellName[cardName].classList.add('favorite')
    }
}

function toggleFavorite(card) {
    const cardName = card['name']
    if (isFavorite(cardName)) {
        unmarkFavorite(cardName)
        cardsByCardName[cardName].classList.remove('favorite')
    } else {
        markFavorite(cardName)
        cardsByCardName[cardName].classList.add('favorite')
    }
}

function tag(text, ...classes) {
    const element = document.createElement('div')
    element.classList.add(...classes)
    element.appendChild(document.createTextNode(text))
    return element
}

// region card section
function schoolTag(card) {
    return tag(card['school']);
}

function sourceTag(card) {
    const abbreviations = {
        "Critical Role (Twitter)": 'CR',
        "Player's Handbook": 'PHB',
        "Xanathar's Guide to Everything": 'XGtE',
        "Strixhaven: A Curriculum of Chaos": 'SACoC',
        "Acquisitions Inc.": 'AI',
        "Tasha's Cauldron of Everything": 'TCoE'
    }
    return tag(abbreviations[card['source']])
}

function levelTag(card) {
    return tag(card['level'])
}

function cardTags(card, small) {
    const element = document.createElement('div')
    element.classList.add('spell-tags')
    if (!small) {
        element.appendChild(schoolTag(card))
        if (card['source'] !== "Player's Handbook")
            element.appendChild(sourceTag(card))
    } else {
        // element.appendChild(levelTag(card))
    }
    return element
}

function name(card, small) {
    const element = document.createElement('div')
    element.classList.add('name')
    element.appendChild(document.createTextNode(small ? hyphenateSync(card['name']) : card['name']))
    return element
}

function level(card) {
    const element = document.createElement('div')
    element.classList.add('level')
    element.classList.add('level-' + card['level'])
    return element
}

function cardSection(card, isOption, small) {
    const element = document.createElement('section')
    element.classList.add('card')
    if (!isOption && !small)
        element.appendChild(cardTags(card, small))
    element.appendChild(name(card, small))
    if (!isOption/* && !small*/)
        element.appendChild(level(card))
    return element
}

// endregion

// region casting section
function castingTimeTag(card) {
    return tag(card['casting time'])
}

function ritualTag() {
    return tag('R')
}

function verbalTag() {
    return tag('V')
}

function somaticTag() {
    return tag('S')
}

function materialTag() {
    return tag('M')
}

function castingTags(card) {
    const element = document.createElement('div')
    element.classList.add('casting-tags')
    if (card['casting time'] !== '1 action')
        element.appendChild(castingTimeTag(card))
    if (card['ritual'])
        element.appendChild(ritualTag())
    if (card['verbal'])
        element.appendChild(verbalTag())
    if (card['somatic'])
        element.appendChild(somaticTag())
    if (card['material'])
        element.appendChild(materialTag())
    return element
}

function requiredMaterial(card) {
    const element = document.createElement('div')
    element.classList.add('required-material')
    const requiredMaterial = document.createElement('span')
    requiredMaterial.classList.add('material')
    requiredMaterial.appendChild(document.createTextNode('Material: '))
    element.appendChild(requiredMaterial)
    element.appendChild(document.createTextNode(card['required material']))
    return element
}

function castingSection(card, small) {
    const element = document.createElement('section')
    element.classList.add('casting')
    element.appendChild(castingTags(card))
    if (!small)
        if ('required material' in card) {
            element.appendChild(requiredMaterial(card))
        }
    return element
}

// endregion

// region effects section
function rangeTag(effect) {
    return tag(effect['range'])
}

function coneTag(cone) {
    return tag(cone['length'], 'icon', 'cone-icon')
}

function cubeTag(cube) {
    return tag(cube['side length'], 'icon', 'cube-icon')
}

function cylinderTag(cylinder) {
    return tag(`${cylinder['height']} / ${cylinder['radius']}`, 'icon', 'cylinder-icon')
}

function lineTag(line) {
    return tag(`${line['length']} / ${line['width']}`, 'icon', 'line-icon')
}

function sphereTag(sphere) {
    return tag(sphere['radius'], 'icon', 'sphere-icon')
}

function areaOfEffectTag(areaOfEffect) {
    switch (areaOfEffect['shape']) {
        case 'cone':
            return coneTag(areaOfEffect)
        case 'cube':
            return cubeTag(areaOfEffect)
        case 'cylinder':
            return cylinderTag(areaOfEffect)
        case 'line':
            return lineTag(areaOfEffect)
        case 'sphere':
            return sphereTag(areaOfEffect)
    }
}

function durationTag(effect) {
    return tag(effect['duration'])
}

function concentrationTag() {
    return tag('C')
}

function effectTags(effect) {
    const element = document.createElement('div')
    element.classList.add('effect-tags')
    if (effect['range'] !== 'Touch' &&
        effect['range'] !== 'Self')
        element.appendChild(rangeTag(effect))
    if ('area of effect' in effect)
        element.appendChild(areaOfEffectTag(effect['area of effect']))
    if (effect['duration'] !== 'Instantaneous')
        element.appendChild(durationTag(effect))
    if (effect['concentration'])
        element.appendChild(concentrationTag())
    return element
}

function effectDescription(effect, small) {
    const element = document.createElement('div')
    element.classList.add('effect-description')
    element.innerHTML =
        effect[small && 'summary' in effect ? 'summary' : 'description']
            .replace(/\n/g, '<br>')
    return element
}

function effect(effect, small) {
    const element = document.createElement('div')
    element.appendChild(effectTags(effect))
    element.appendChild(effectDescription(effect, small))
    return element
}

function effectsSection(card, small) {
    const element = document.createElement('section')
    element.classList.add('effects')
    card['effects'].forEach(data => {
        element.appendChild(effect(data, small))
    })
    return element
}

// endregion

// region expansion
// region card description section
function cardDescriptionSection(card) {
    const element = document.createElement('section')
    element.classList.add('card-description')
    element.innerHTML = card['description'].replace(/\n/g, '<br>')
    if ('at higher levels' in card) {
        const atHigherLevels = document.createElement('span')
        atHigherLevels.classList.add('at-higher-levels')
        atHigherLevels.appendChild(document.createTextNode('At higher levels: '))
        element.appendChild(document.createElement('br'))
        element.appendChild(document.createElement('br'))
        element.appendChild(atHigherLevels)
        element.appendChild(document.createTextNode(card['at higher levels']))
    }
    if ('at higher spell slot levels' in card) {
        const atHigherLevels = document.createElement('span')
        element.appendChild(document.createElement('br'))
        element.appendChild(document.createElement('br'))
        atHigherLevels.classList.add('at-higher-levels')
        atHigherLevels.appendChild(document.createTextNode('At higher levels: '))
        element.appendChild(atHigherLevels)
        element.appendChild(document.createTextNode(card['at higher spell slot levels']))
    }
    return element;
}

// endregion

// region buttons section
function chosenSegment(card) {
    const element = document.createElement('button')
    element.classList.add('button-segment', 'chosen-segment')
    element.appendChild(document.createTextNode('Chosen'))
    element.onclick = e => {
        e.stopImmediatePropagation()
        toggleChosen(card)
    }
    return element
}

function knownSegment(card) {
    const element = document.createElement('button')
    element.classList.add('button-segment', 'known-segment')
    element.appendChild(document.createTextNode('Known'))
    element.onclick = e => {
        e.stopImmediatePropagation()
        toggleKnown(card)
    }
    return element
}

function preparedSegment(card) {
    const element = document.createElement('button')
    element.classList.add('button-segment', 'prepared-segment')
    element.appendChild(document.createTextNode('Prepared'))
    element.onclick = e => {
        e.stopImmediatePropagation()
        togglePrepared(card)
    }
    return element
}

function castabilityButton(card) {
    const element = document.createElement('div')
    element.classList.add('segmented-button')
    if (card['level'] === '0')
        element.appendChild(chosenSegment(card))
    else {
        element.appendChild(knownSegment(card))
        element.appendChild(preparedSegment(card))
    }
    return element
}

function favoriteButton(card) {
    const element = document.createElement('button')
    element.classList.add('button', 'favorite-button')
    element.onclick = e => {
        e.stopImmediatePropagation()
        toggleFavorite(card)
    }
    return element
}

function buttonsSection(card, isOption) {
    const element = document.createElement('section')
    element.classList.add('buttons')
    element.appendChild(favoriteButton(card))
    if (!isOption)
        element.appendChild(castabilityButton(card))
    return element
}

// endregion

function expansion(card, isOption) {
    const element = document.createElement('div')
    element.classList.add('expansion')
    const wrapper = document.createElement('div')
    wrapper.classList.add('height-measuring-wrapper')
    wrapper.appendChild(document.createElement('hr'))
    wrapper.appendChild(cardDescriptionSection(card))
    wrapper.appendChild(document.createElement('hr'))
    wrapper.appendChild(buttonsSection(card, isOption))
    element.appendChild(wrapper)
    return element
}

// endregion

function card(card, isOption, small) {
    const element = document.createElement('div')
    element.classList.add('spell-card')

    const name = card['name'];
    cardsByCardName[name] = element
    if (isFavorite(name))
        element.classList.add('favorite')
    if (!isOption) {
        cardsBySpellName[name] = element
        if (isChosen(name))
            element.classList.add('chosen')
        if (isKnown(name))
            element.classList.add('known')
        if (isPrepared(name))
            element.classList.add('prepared')
    }

    element.onclick = e => {
        e.stopImmediatePropagation()
        toggleCardSelection(element)
    }
    element.appendChild(cardSection(card, isOption, small))
    if (!small)
        if ('required material' in card) {
            let hr = document.createElement('hr')
            hr.classList.add('light')
            element.appendChild(hr)
        }
    element.appendChild(castingSection(card, small))
    element.appendChild(document.createElement('hr'))
    element.appendChild(effectsSection(card, small))
    element.appendChild(expansion(card, isOption))
    return element
}

function spellSection(group, small) {
    const element = document.createElement('section')
    element.classList.add('spell')
    if (!small) element.appendChild(cardTags(group, small))
    element.appendChild(name(group, small))
    element.appendChild(level(group))
    return element
}

function groupFavoriteButton(card) {
    const element = document.createElement('button')
    element.classList.add('button', 'favorite-button')
    element.onclick = e => {
        e.stopImmediatePropagation()
        toggleFavoriteSpell(card)
    }
    return element
}

function groupButtonsSection(card) {
    const element = document.createElement('section')
    element.classList.add('buttons')
    element.appendChild(groupFavoriteButton(card))
    element.appendChild(castabilityButton(card))
    return element
}

function groupExpansion(group) {
    const element = document.createElement('div')
    element.classList.add('expansion')
    const wrapper = document.createElement('div')
    wrapper.classList.add('height-measuring-wrapper')
    wrapper.appendChild(document.createElement('hr'))
    wrapper.appendChild(groupButtonsSection(group))
    element.appendChild(wrapper)
    return element
}

function optionsSection(group, small) {
    const element = document.createElement('section')
    element.classList.add('options')
    group['options'].forEach(option => element.appendChild(card(option, true, small)))
    return element
}

function group(group, small) {
    const element = document.createElement('div')
    element.classList.add('spell-group')
    element.onclick = () => toggleCardSelection(element)
    const name = group['name'];
    cardsBySpellName[name] = element
    if (isChosen(name))
        element.classList.add('chosen')
    if (isKnown(name))
        element.classList.add('known')
    if (isPrepared(name))
        element.classList.add('prepared')
    element.appendChild(spellSection(group, small))
    element.appendChild(groupExpansion(group))
    element.appendChild(optionsSection(group, small))
    return element
}

function load(cards, small) {
    if (!small) cardList.classList.remove('small')
    if (small) cardList.classList.add('small')
    let scaffolds = cardList.querySelectorAll('.spell-card-scaffold')
    if (scaffolds.length > cards.length) {
        for (const scaffold of [].slice.call(scaffolds, cards.length)) {
            scaffold.remove();
        }
    } else {
        for (let i = scaffolds.length; i < cards.length; i++) {
            cardList.appendChild(scaffold())
        }
    }
    scaffolds = cardList.querySelectorAll('.spell-card-scaffold')
    for (let i = 0; i < cards.length; i++) {
        const spellCard = cards[i];
        const scaffold = scaffolds[i];
        setTimeout(() => {
            scaffold.insertAdjacentElement('beforebegin',
                'options' in spellCard ? group(spellCard, small) : card(spellCard, false, small))
            scaffold.remove()
        }, i % 15)
    }
    console.timeStamp("done loading")
}

function loadAll() {
    load(allSpellCards, true)
}

function prepareAll() {
    cardList.innerHTML = ''
    showScaffold(150)
}

function showAll() {
    prepareAll();
    loadAll()
}

function loadCastable() {
    load(allSpellCards.filter(isCastable), true)
}

function prepareCastable() {
    cardList.innerHTML = ''
    showScaffold(10)
}

function showCastable() {
    prepareCastable();
    loadCastable()
}

function scaffold() {
    const element = document.createElement('div')
    element.classList.add('spell-card-scaffold')
    return element
}

function showScaffold(cards) {
    for (let i = 0; i < cards; i++) {
        cardList.appendChild(scaffold())
    }
    console.timeStamp("done scaffolding")
}

const castableButton = document.getElementById('castable')
const allButton = document.getElementById('all')

function switchToAll() {
    if (currentMode() === 'castable') {
        castableButton.classList.remove('bottom-nav__destination--active')
        allButton.classList.add('bottom-nav__destination--active')
        showAll()
        setMode('all')
    }
}

function switchToCastable() {
    if (currentMode() === 'all') {
        allButton.classList.remove('bottom-nav__destination--active')
        castableButton.classList.add('bottom-nav__destination--active')
        showCastable()
        setMode('castable')
    }
}

if (currentMode() === 'all')
    allButton.classList.add('bottom-nav__destination--active')
else if (currentMode() === 'castable')
    castableButton.classList.add('bottom-nav__destination--active')

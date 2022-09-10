const cardList = document.querySelector('.spell-card-list');

// region card selection
let selectedCard = null
let resizeObserver = new ResizeObserver(entries => {
    const expansion = selectedCard.querySelector('.expansion')
    const wrapper = expansion.querySelector('.height-measuring-wrapper')
    expansion.style.setProperty('transition-duration', `${Math.max(0.2, wrapper.clientHeight * 0.001)}s`)
    expansion.style.setProperty('height', `${wrapper.clientHeight}px`)
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
        expansion.style.setProperty('transition-duration', `${wrapper.clientHeight * 0.001}s`)
        expansion.style.setProperty('height', `${wrapper.clientHeight}px`)
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

function tag(text) {
    const element = document.createElement('div')
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

function cardTags(card) {
    const element = document.createElement('div')
    element.classList.add('spell-tags')
    element.appendChild(schoolTag(card))
    if (card['source'] !== "Player's Handbook")
        element.appendChild(sourceTag(card))
    return element
}

function name(card) {
    const element = document.createElement('div')
    element.classList.add('name')
    element.appendChild(document.createTextNode(card['name']))
    return element
}

function level(card) {
    const element = document.createElement('div')
    element.classList.add('level')
    element.classList.add('level-' + card['level'])
    return element
}

function cardSection(card, isOption) {
    const element = document.createElement('section')
    element.classList.add('card')
    if (!isOption)
        element.appendChild(cardTags(card))
    element.appendChild(name(card))
    if (!isOption)
        element.appendChild(level(card))
    return element
}

// endregion

// region casting section
function castingTimeTag(card) {
    return tag(card['casting time'])
}

function ritualTag() {
    return tag('Ritual')
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

function castingSection(card) {
    const element = document.createElement('section')
    element.classList.add('casting')
    element.appendChild(castingTags(card))
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

function durationTag(effect) {
    return tag(effect['duration'])
}

function concentrationTag() {
    return tag('Concentration')
}

function effectTags(effect) {
    const element = document.createElement('div')
    element.classList.add('effect-tags')
    if (effect['range'] !== 'Touch' &&
        effect['range'] !== 'Self')
        element.appendChild(rangeTag(effect))
    if (effect['duration'] !== 'Instantaneous')
        element.appendChild(durationTag(effect))
    if (effect['concentration'])
        element.appendChild(concentrationTag())
    // TODO
    // if ('area of effect' in effect)
    //     element.appendChild(areaOfEffectTag(effect))
    return element
}

function effectDescription(effect) {
    const element = document.createElement('div')
    element.classList.add('effect-description')
    element.innerHTML = effect['description'].replace(/\n/g, '<br>')
    return element
}

function effect(effect) {
    const element = document.createElement('div')
    element.appendChild(effectTags(effect))
    element.appendChild(effectDescription(effect))
    return element
}

function effectsSection(card) {
    const element = document.createElement('section')
    element.classList.add('effects')
    card['effects'].forEach(data => {
        element.appendChild(effect(data))
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

function card(card, isOption) {
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
    element.appendChild(cardSection(card, isOption))
    if ('required material' in card) {
        let hr = document.createElement('hr')
        hr.classList.add('light')
        element.appendChild(hr)
    }
    element.appendChild(castingSection(card))
    element.appendChild(document.createElement('hr'))
    element.appendChild(effectsSection(card))
    element.appendChild(expansion(card, isOption))
    return element
}

function spellSection(group) {
    const element = document.createElement('section')
    element.classList.add('spell')
    element.appendChild(cardTags(group))
    element.appendChild(name(group))
    element.appendChild(level(group))
    return element
}

function optionsSection(group) {
    const element = document.createElement('section')
    element.classList.add('options')
    group['options'].forEach(option => element.appendChild(card(option, true)))
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

function groupExpansion(card) {
    const element = document.createElement('div')
    element.classList.add('expansion')
    const wrapper = document.createElement('div')
    wrapper.classList.add('height-measuring-wrapper')
    wrapper.appendChild(document.createElement('hr'))
    wrapper.appendChild(groupButtonsSection(card))
    element.appendChild(wrapper)
    return element
}

function group(group) {
    // TODO move spell name, chips and level all to the group, and rethink elevation (spell group 1 or 2, cards 1 or 2?)
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
    element.appendChild(spellSection(group))
    element.appendChild(groupExpansion(group))
    element.appendChild(optionsSection(group))
    return element
}

function load(cards) {
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
                'options' in spellCard ? group(spellCard) : card(spellCard, false))
            scaffold.remove()
        }, i % 15)
    }
    console.timeStamp("done loading")
}

function loadAll() {
    load(allSpellCards)
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
    load(allSpellCards.filter(isCastable))
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

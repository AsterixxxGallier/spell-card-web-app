const cardList = document.querySelector('.spell-card-list');

// region card selection
let selectedCard = null
let resizeObserver = new ResizeObserver(entries => {
    const expansion = selectedCard.querySelector('.expansion')
    const wrapper = expansion.querySelector('.height-measuring-wrapper')
    expansion.style.setProperty('transition-duration', `${wrapper.clientHeight * 0.001}s`)
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

fetch("../data/effects.json").then(response => response.json()).then(json => {
    console.log(json)
    allSpellCards = Object
        .entries(json)
        .flatMap(([level, spells]) => spells.map(spell => ({
            ...spell,
            'level': level
        })))
    loadAll()
});

function schoolTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(spell['school']))
    element.appendChild(span)
    return element
}

function sourceTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    const abbreviations = {
        "Critical Role (Twitter)": 'CR',
        "Player's Handbook": 'PHB',
        "Xanathar's Guide to Everything": 'XGtE',
        "Strixhaven: A Curriculum of Chaos": 'SACoC',
        "Acquisitions Inc.": 'AI',
        "Tasha's Cauldron of Everything": 'TCoE'
    }
    span.appendChild(document.createTextNode(abbreviations[spell['source']]))
    element.appendChild(span)
    return element
}

function originalNameTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(spell['original name']))
    element.appendChild(span)
    return element
}

function spellTags(spell) {
    const element = document.createElement('div')
    element.classList.add('spell-tags')
    element.appendChild(schoolTag(spell))
    if (spell['source'] !== "Player's Handbook")
        element.appendChild(sourceTag(spell))
    if ('original name' in spell)
        element.appendChild(originalNameTag(spell))
    return element
}

function name(spell) {
    const element = document.createElement('div')
    element.classList.add('name')
    element.appendChild(document.createTextNode(spell['name']))
    return element
}

function level(spell) {
    const element = document.createElement('div')
    element.classList.add('level')
    element.classList.add('level-' + spell['level'])
    return element
}

function castingTimeTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(spell['casting time']))
    element.appendChild(span)
    return element
}

function ritualTag() {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('Ritual'))
    element.appendChild(span)
    return element
}

function verbalTag() {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('V'))
    element.appendChild(span)
    return element
}

function somaticTag() {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('S'))
    element.appendChild(span)
    return element
}

function materialTag() {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('M'))
    element.appendChild(span)
    return element
}

function spellSection(spell) {
    const element = document.createElement('section')
    element.classList.add('spell')
    element.appendChild(spellTags(spell))
    element.appendChild(name(spell))
    element.appendChild(level(spell))
    return element
}

function castingTags(spell) {
    const element = document.createElement('div')
    element.classList.add('casting-tags')
    if (spell['casting time'] !== '1 action')
        element.appendChild(castingTimeTag(spell))
    if (spell['ritual'])
        element.appendChild(ritualTag())
    if (spell['verbal'])
        element.appendChild(verbalTag())
    if (spell['somatic'])
        element.appendChild(somaticTag())
    if (spell['material'])
        element.appendChild(materialTag())
    return element
}

function requiredMaterial(spell) {
    const element = document.createElement('div')
    element.classList.add('required-material')
    const requiredMaterial = document.createElement('span')
    requiredMaterial.classList.add('material')
    requiredMaterial.appendChild(document.createTextNode('Material: '))
    element.appendChild(requiredMaterial)
    element.appendChild(document.createTextNode(spell['required material']))
    return element
}

function casting(spell) {
    const element = document.createElement('section')
    element.classList.add('casting')
    element.appendChild(castingTags(spell))
    if ('required material' in spell) {
        element.appendChild(requiredMaterial(spell))
    }
    return element
}

function rangeTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(spell['range']))
    element.appendChild(span)
    return element
}

function durationTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode(spell['duration']))
    element.appendChild(span)
    return element
}

function concentrationTag(spell) {
    const element = document.createElement('div')
    const span = document.createElement('span')
    span.appendChild(document.createTextNode('Concentration'))
    element.appendChild(span)
    return element
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
        element.appendChild(concentrationTag(effect))
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

function effects(spell) {
    const element = document.createElement('section')
    element.classList.add('effects')
    spell['effects'].forEach(data => {
        element.appendChild(effect(data))
    })
    return element
}

function expansion(spell) {
    const element = document.createElement('div')
    element.classList.add('expansion')
    const wrapper = document.createElement('div')
    wrapper.classList.add('height-measuring-wrapper')
    const description = document.createElement('section')
    description.classList.add('spell-description')
    description.innerHTML = spell['description'].replace(/\n/g, '<br>')
    if ('at higher levels' in spell) {
        const atHigherLevels = document.createElement('span')
        atHigherLevels.classList.add('at-higher-levels')
        atHigherLevels.appendChild(document.createTextNode('At higher levels: '))
        description.appendChild(document.createElement('br'))
        description.appendChild(document.createElement('br'))
        description.appendChild(atHigherLevels)
        description.appendChild(document.createTextNode(spell['at higher levels']))
    }
    if ('at higher spell slot levels' in spell) {
        const atHigherLevels = document.createElement('span')
        description.appendChild(document.createElement('br'))
        description.appendChild(document.createElement('br'))
        atHigherLevels.classList.add('at-higher-levels')
        atHigherLevels.appendChild(document.createTextNode('At higher levels: '))
        description.appendChild(atHigherLevels)
        description.appendChild(document.createTextNode(spell['at higher spell slot levels']))
    }
    wrapper.appendChild(document.createElement('hr'))
    wrapper.appendChild(description)
    element.appendChild(wrapper)
    return element
}

function card(spell) {
    const element = document.createElement('div')
    element.classList.add('spell-card')
    element.onclick = () => toggleCardSelection(element)
    element.appendChild(spellSection(spell))
    if ('required material' in spell) {
        let hr = document.createElement('hr')
        hr.classList.add('light')
        element.appendChild(hr)
    }
    element.appendChild(casting(spell))
    element.appendChild(document.createElement('hr'))
    element.appendChild(effects(spell))
    element.appendChild(expansion(spell))
    return element
}

function load(cards) {
    let scaffolds = cardList.querySelectorAll('.spell-card-scaffold')
    if (scaffolds.length > cards.length) {
        for (const scaffold of [].slice.call(scaffolds, cards.length)) {
            scaffold.remove();
        }
    } else {
        for (let i = cards.length; i < scaffolds.length; i++) {
            cardList.appendChild(scaffold())
        }
    }
    scaffolds = cardList.querySelectorAll('.spell-card-scaffold')
    for (let i = 0; i < cards.length; i++) {
        const spellCard = cards[i];
        const scaffold = scaffolds[i];
        setTimeout(() => {
            if (scaffold) {
                scaffold.insertAdjacentElement('beforebegin', card(spellCard))
                scaffold.remove()
            }
        }, i % 15)
    }
}

function loadAll() {
    load(allSpellCards)
}

function showAll() {
    cardList.innerHTML = ''
    showScaffold(150)
    loadAll()
}

function loadPrepared() {
    load(allSpellCards.slice(5, 15))
}

function showPrepared() {
    cardList.innerHTML = ''
    showScaffold(10)
    loadPrepared()
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
}

showScaffold(150)

const preparedButton = document.getElementById('prepared')
const allButton = document.getElementById('all')
let preparedOnly = false

function switchToAll() {
    if (preparedOnly) {
        preparedButton.classList.remove('bottom-nav__destination--active')
        allButton.classList.add('bottom-nav__destination--active')
        showAll()
        preparedOnly = false
    }
}

function switchToPrepared() {
    if (!preparedOnly) {
        allButton.classList.remove('bottom-nav__destination--active')
        preparedButton.classList.add('bottom-nav__destination--active')
        showPrepared()
        preparedOnly = true
    }
}

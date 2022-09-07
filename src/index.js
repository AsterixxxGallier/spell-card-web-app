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

let spellData

fetch("../data/effects.json").then(response => response.json()).then(json => {
    console.log(json)
    spellData = Object
        .entries(json)
        .flatMap(([level, spells]) => spells.map(spell => ({
            ...spell,
            'level': level
        })))
    showAll()
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
    let level = parseInt(spell['level']);
    switch (level) {
        case 0:
            // element.classList.add('outline-0')
            break
        case 1:
        case 2:
            element.classList.add('outline-1')
            break
        case 3:
        case 4:
            element.classList.add('outline-2')
            break
        case 5:
        case 6:
        case 7:
            element.classList.add('outline-3')
            break
        case 8:
        case 9:
            element.classList.add('outline-4')
            break
    }
    if (level === 0) {
        const img = document.createElement('img')
        img.src = '../icons/clean.png'
        element.appendChild(img)
    } else {
        const div = document.createElement('div')
        div.appendChild(document.createTextNode(spell['level']))
        element.appendChild(div)
    }
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
    element.appendChild(document.createTextNode(effect['description']))
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
    description.appendChild(document.createTextNode(spell['description']))
    if ('at higher levels' in spell) {
        const atHigherLevels = document.createElement('span')
        atHigherLevels.classList.add('at-higher-levels')
        atHigherLevels.appendChild(document.createTextNode('At higher levels: '))
        description.appendChild(atHigherLevels)
        description.appendChild(document.createTextNode(spell['at higher levels']))
    }
    if ('at higher spell slot levels' in spell) {
        const atHigherLevels = document.createElement('span')
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

function showAll() {
    for (const spell of spellData) {
        const scaffold = cardList.querySelector('.spell-card-scaffold')
        if (scaffold) {
            scaffold.insertAdjacentElement('beforebegin', card(spell))
            scaffold.remove()
        } else {
            cardList.appendChild(card(spell))
        }
    }
    const scaffolds = cardList.querySelectorAll('.spell-card-scaffold')
    for (const scaffold of scaffolds) {
        scaffold.remove()
    }
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

const obecne = [
  "Je distanční výuka složitější než prezenční, pokud ano, tak proč?",
  "Věnuji škole více času než v prezenční výuce?",
  "Naučím se stejné množství látky jako v prezenční výuce?",
]

const osobni = {m: [
  "Naučím se toho hodně v jeho hodinách",
  "Látka vysvětlována jasně a srozumitelně",
  "Zpestřuje hodiny",
  "Vede nás k samostatnému uvažování a hledání řešení",
  "Preferuji mít s tímto profesorem prezenční výuku oproti distanční",
  "Zkoušení a písemky mají jasná pravidla, takže se na ně můžu připravit",
  "Jeho hodnocení rozumím a vím, co a proč mi vychází",
  "Ke studentům se chová vstřícně, vždy je připraven jim pomoci",
], f: [
  "Naučím se toho hodně v jejích hodinách",
  "Látka vysvětlována jasně a srozumitelně",
  "Zpestřuje hodiny",
  "Vede nás k samostatnému uvažování a hledání řešení",
  "Preferuji mít s touto profesorkou prezenční výuku oproti distanční",
  "Zkoušení a písemky mají jasná pravidla, takže se na ně můžu připravit",
  "Jejímu hodnocení rozumím a vím, co a proč mi vychází",
  "Ke studentům se chová vstřícně, vždy je připravena jim pomoci",
]}

const tridy = {pi: 'prima A', bi: 'prima B', su: 'sekunda', te: 'tercie', ka: 'kvarta', ki: 'kvinta', se: 'sexta', si: 'septima A', zi: 'septima B', ko: 'oktáva'}
const subjects = ['Estetická výchova výtvarná', 'Dramatická výchova', 'Tělesná výchova', 'Ruský jazyk - seminář', 'Společenskovědní základ', 'Španělský jazyk s lektorem', 'Biologie', 'Anglický jazyk s lektorem', 'Konverzace ve španělském jazyce', 'Cvičení z fyziky', 'Cvičení ze společenskovědního základu', 'Konverzace v ruském jazyce', 'Logika', 'Informační a komunikační technologie', 'Německý jazyk s lektorem', 'Matematika - seminář', 'Zeměpis - seminář', 'Deskriptivní geometrie - seminář', 'Společenskovědní základ - dramatická část', 'Zeměpis', 'Konverzace v německém jazyce', 'Programování - seminář', 'Německý jazyk', 'Obchodní angličtina', 'Přírodní vědy - seminář', 'Fyzika', 'Latina', 'Cvičení z matematiky', 'Etická výchova', 'Španělský jazyk', 'Ekonomika a účetnictví - seminář', 'Anglický jazyk', 'Estetická výchova hudební', 'Konverzace ve francouzském jazyce', 'Biologie - seminář', 'Výtvarná výchova', 'Anglická konverzace', 'Český jazyk a literatura - seminář', 'Francouzský jazyk', 'Matematika', 'Chemie', 'Člověk a moderní společnost', 'Fyzika - seminář', 'Výchova ke zdraví', 'Estetická výchova - seminář', 'Laboratorní práce', 'Chemie - seminář', 'Český jazyk a literatura', 'Dějepis', 'Hudební výchova', 'Dějepis - seminář']
const people = [['Jílek Štěpán', 'm'], ['Kozubek Jan', 'm'], ['Kolmanová Jitka', 'f'], ['Řepa Martin', 'm'], ['Daněk Jan', 'm'], ['Polívka Jiří', 'm'], ['Šíba Michal', 'm'], ['Polášková Jana', 'f'], ['Pastyříková Vladimíra', 'f'], ['Hlaváček Antonín', 'm'], ['Marek Aleš', 'm'], ['Torres Isabel', 'f'], ['Tříska Pavel', 'm'], ['Nájemník Václav', 'm'], ['Farrimondová Helena', 'f'], ['Hovězáková Božena', 'f'], ['Ulrichová Hana', 'f'], ['Webb Robert Brisbane', 'm'], ['Ekrtová Marie', 'f'], ['Gürbig Friederike', 'f'], ['Horešovská Hana', 'f'], ['Kubíková Lucie', 'f'], ['Orr Alan John', 'm'], ['Dudilieux Marie', 'f'], ['Ambroz Michal', 'm'], ['Nesterova Alla', 'f'], ['Peterka Matyáš', 'm'], ['Suchardová Hana', 'f'], ['Zábranská Ivana', 'f'], ['Schneider Benjamin', 'm'], ['Smilek Petr', 'm'], ['Svobodová Helena', 'f'], ['Toulec Martin', 'm'], ['Dominec Adam', 'm'], ['Rabiecová Iveta', 'f']]
const table = {
  pi: [[0, 47], [14, 31], [2, 31], [1, 39], [32, 48], [29, 4], [16, 18], [34, 25], [18, 6], [5, 49], [7, 35], [24, 2], [20, 2], [21, 2]],
  bi: [[10, 47], [14, 31], [2, 31], [1, 39], [21, 13], [32, 48], [29, 4], [1, 25], [26, 40], [6, 6], [24, 19], [18, 45], [26, 45], [30, 45], [5, 49], [34, 35], [24, 2], [21, 2], [22, 36], [16, 1], [26, 28]],
  su: [[0, 47], [14, 31], [8, 31], [15, 22], [23, 38], [27, 29], [34, 39], [21, 13], [13, 48], [29, 4], [1, 25], [6, 40], [24, 19], [18, 45], [26, 45], [5, 49], [7, 35], [24, 2], [21, 2], [22, 36], [16, 1]],
  te: [[0, 47], [8, 31], [22, 7], [15, 22], [23, 38], [27, 29], [1, 39], [21, 13], [13, 48], [1, 25], [26, 40], [18, 6], [24, 19], [5, 49], [7, 35], [24, 2], [21, 2], [20, 43], [22, 36], [16, 1], [26, 28]],
  ka: [[0, 47], [2, 31], [22, 31], [8, 31], [17, 31], [22, 7], [15, 22], [23, 38], [27, 29], [34, 39], [33, 13], [32, 48], [32, 4], [30, 25], [26, 40], [31, 6], [5, 32], [7, 0], [24, 2], [20, 2]],
  ki: [[10, 47], [2, 31], [22, 31], [8, 31], [17, 31], [22, 7], [15, 22], [23, 38], [27, 29], [28, 39], [33, 13], [13, 48], [13, 4], [30, 25], [18, 40], [6, 6], [5, 32], [7, 0], [24, 2], [21, 2]],
  se: [[10, 47], [2, 31], [22, 31], [17, 31], [22, 7], [15, 22], [23, 38], [27, 29], [30, 39], [21, 13], [32, 48], [32, 4], [34, 25], [6, 40], [31, 6], [28, 19], [5, 32], [7, 0], [24, 2], [20, 2], [21, 2]],
  si: [[10, 47], [2, 31], [22, 31], [17, 31], [22, 7], [15, 22], [19, 14], [23, 38], [27, 29], [11, 5], [34, 39], [13, 4], [13, 41], [28, 41], [20, 2], [21, 2], [10, 37], [13, 50], [7, 44], [9, 3], [25, 3], [1, 15], [28, 16], [31, 34], [18, 46], [6, 24], [30, 42], [34, 17], [3, 30], [33, 21], [19, 20], [23, 33], [11, 8], [30, 9], [12, 26], [32, 10], [32, 10], [12, 26], [26, 12], [26, 12], [30, 9]],
  zi: [[10, 47], [2, 31], [22, 31], [17, 31], [22, 7], [15, 22], [19, 14], [23, 38], [27, 29], [11, 5], [28, 39], [13, 4], [13, 41], [28, 41], [20, 2], [10, 37], [13, 50], [7, 44], [9, 3], [25, 3], [1, 15], [28, 16], [31, 34], [18, 46], [6, 24], [30, 42], [34, 17], [3, 30], [33, 21], [19, 20], [23, 33], [11, 8], [30, 9], [12, 26], [32, 10], [19, 20], [11, 8], [12, 26], [26, 12], [26, 12], [30, 9]],
  ko: [[0, 47], [4, 31], [22, 31], [22, 7], [15, 22], [19, 14], [23, 38], [27, 29], [11, 5], [28, 39], [13, 4], [32, 41], [24, 2], [20, 2], [10, 37], [32, 50], [7, 44], [9, 3], [30, 15], [28, 16], [31, 34], [6, 46], [6, 24], [30, 42], [34, 17], [33, 21], [19, 20], [11, 8], [9, 11], [30, 9], [28, 27], [12, 26], [32, 10], [32, 10], [19, 20], [12, 26], [30, 9], [22, 23]]}

function questionStep(group, step) {
  if (step < obecne.length) {
    return { text: obecne[step] }
  } else {
    step -= obecne.length
  }
  if (step < table[group].length) {
    const [personId, subjectId] = table[group][step]
    const [name, gender] = people[personId]
    const subject = subjects[subjectId]
    return { name, subject, questions: osobni[gender], options: [1, 2, 3, 4, 5] }
  }
  return { done: true }
}

module.exports = {tridy, questionStep}

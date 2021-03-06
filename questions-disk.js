const obecne = [
  "Distanční výuka je složitější než prezenční (Pokud ano, proč?)",
  "Chtěl/a bych přenést prvky distanční výuky do prezenční výuky (Pokud ano, jaké?)",
  "Dostával/a jsem během distanční výuky více úkolů než během prezenční výuky (Pokud ano, z jakých předmětů?)",
  "Naučil/a jsem se stejné množství látky jako v prezenční výuce",
  "Věnoval/a jsem více svého volného času škole v online výuce",
]

const dvojite = {m: [
  "Naučím se toho hodně v jeho hodinách",
  "Látka vysvětlována jasně a srozumitelně",
  "Zpestřuje hodiny",
  "Vede nás k samostatnému uvažování a hledání řešení",
  "Zkoušení a písemky mají jasná pravidla, takže se na ně můžu připravit",
  "Jeho hodnocení rozumím a vím, co a proč mi vychází",
  "Ke studentům se chová vstřícně, vždy je připraven jim pomoci",
], f: [
  "Naučím se toho hodně v jejích hodinách",
  "Látka vysvětlována jasně a srozumitelně",
  "Zpestřuje hodiny",
  "Vede nás k samostatnému uvažování a hledání řešení",
  "Zkoušení a písemky mají jasná pravidla, takže se na ně můžu připravit",
  "Jejímu hodnocení rozumím a vím, co a proč mi vychází",
  "Ke studentům se chová vstřícně, vždy je připravena jim pomoci",
]}

const jednoduche = {m: [
  "Jeho přístup k předmětu se během distanční výuky změnil",
], f: [
  "Její přístup k předmětu se během distanční výuky změnil",
]}

const tridy = {pi: 'prima A', bi: 'prima B', su: 'sekunda', te: 'tercie', ka: 'kvarta', ki: 'kvinta', se: 'sexta', si: 'septima A', zi: 'septima B', ko: 'oktáva'}
const subjects = ['Tělesná výchova', 'Zeměpis', 'Anglický jazyk', 'Francouzský jazyk s lektorem', 'Konverzace ve francouzském jazyce', 'Informační a komunikační technologie', 'Programování - seminář', 'Francouzský jazyk', 'Biologie', 'Chemie', 'Přírodní vědy - seminář', 'Konverzace v německém jazyce', 'Německý jazyk s lektorem', 'Ruský jazyk - seminář', 'Ekonomika a účetnictví - seminář', 'Výchova ke zdraví', 'Německý jazyk', 'Český jazyk a literatura', 'Fyzika', 'Matematika - seminář', 'Matematika', 'Výtvarná výchova', 'Český jazyk a literatura - seminář', 'Konverzace ve španělském jazyce', 'Španělský jazyk', 'Dějepis - seminář', 'Dějepis', 'Společenskovědní základ', 'Člověk a moderní společnost', 'Anglická konverzace', 'Anglický jazyk s lektorem', 'Obchodní angličtina', 'Chemie - seminář', 'Etická výchova', 'Logika', 'Estetická výchova - seminář', 'Estetická výchova výtvarná', 'Estetická výchova hudební', 'Hudební výchova', 'Latina', 'Deskriptivní geometrie - seminář', 'Cvičení z fyziky', 'Cvičení z matematiky', 'Fyzika - seminář', 'Laboratorní práce', 'Biologie - seminář', 'Cvičení ze společenskovědního základu', 'Společenskovědní základ - dramatická část', 'Dramatická výchova', 'Zeměpis - seminář']
const people = [['Ambroz Michal', 'm'], ['Brabcová Kateřina', 'f'], ['Djiboghlian Caroline', 'f'], ['Dominec Adam', 'm'], ['Dudilieux Marie', 'f'], ['Ekrtová Marie', 'f'], ['Gürbig Friederike', 'f'], ['Hlaváček Antonín', 'm'], ['Holická Ivana', 'f'], ['Horešovská Hana', 'f'], ['Hovězáková Božena', 'f'], ['Jílek Štěpán', 'm'], ['Kolmanová Jitka', 'f'], ['Kozubek Jan', 'm'], ['Kubíková Lucie', 'f'], ['Marek Aleš', 'm'], ['Morantes Sandra', 'f'], ['Nájemník Václav', 'm'], ['Nesterova Alla', 'f'], ['Orr Alan John', 'm'], ['Pastyříková Vladimíra', 'f'], ['Peterka Matyáš', 'm'], ['Polášková Jana', 'f'], ['Polívka Jiří', 'm'], ['Pospíšilová Eliška', 'f'], ['Pospíšilová Pavlína', 'f'], ['Rabiecová Iveta', 'f'], ['Smilek Petr', 'm'], ['Svobodová Helena', 'f'], ['Šíba Michal', 'm'], ['Toulec Martin', 'm'], ['Tříska Pavel', 'm'], ['Ulrichová Hana', 'f'], ['Voruda Petr', 'm'], ['Zábranská Ivana', 'f']]
const table = {"pi": [[0, 0, "Chl"], [1, 2, null], [13, 18, null], [13, 20, null], [14, 0, "D\u00edv"], [15, 17, null], [17, 26, null], [20, 27, null], [21, 5, null], [22, 21, "AJ1"], [25, 21, "AJ2"], [29, 8, null], [32, 47, null], [33, 38, null]], "bi": [[0, 0, "Chl"], [5, 8, null], [12, 2, "AJ1"], [13, 20, null], [14, 0, "D\u00edv"], [15, 17, null], [17, 26, null], [17, 27, null], [20, 2, "AJ2"], [21, 5, null], [22, 21, "AJ1"], [25, 21, "AJ2"], [26, 18, null], [32, 47, null], [33, 38, null]], "su": [[0, 0, "Chl"], [0, 1, null], [5, 9, null], [11, 17, null], [12, 2, "AJ1"], [13, 21, null], [14, 5, null], [14, 0, "D\u00edv"], [19, 29, "AKn1"], [19, 30, null], [20, 2, "AJ2"], [20, 27, null], [21, 33, "ET"], [23, 38, null], [26, 20, null], [27, 18, null], [27, 44, null], [29, 8, null], [30, 26, null], [32, 48, null]], "te": [[0, 0, "D\u00edv"], [0, 1, null], [1, 2, "AJ1"], [3, 5, null], [4, 7, "FJ"], [5, 8, null], [9, 0, "D\u00edv"], [11, 17, null], [12, 2, "AJ2"], [12, 16, "NJ"], [14, 0, "Chl"], [16, 24, "\u0160J"], [19, 0, "Chl"], [19, 29, "AK1"], [19, 30, null], [20, 27, null], [21, 33, "ET"], [22, 21, null], [23, 38, null], [26, 18, null], [26, 20, null], [27, 44, "LP2"], [29, 9, null], [30, 26, null]], "ka": [[0, 0, "Chl"], [0, 1, null], [1, 2, "AJ2"], [3, 5, null], [4, 7, "FJ"], [5, 8, null], [9, 15, null], [10, 16, "NJ"], [13, 20, null], [14, 0, "D\u00edv"], [15, 17, null], [16, 24, "\u0160J"], [19, 29, "Ak"], [19, 30, null], [20, 2, "AJ1"], [21, 33, "ET"], [22, 21, null], [23, 38, null], [27, 18, null], [29, 9, null], [30, 26, null]], "ki": [[0, 0, "Chl"], [1, 2, "AJ1"], [3, 5, null], [4, 7, "FJ"], [9, 0, "D\u00edv"], [10, 16, "NJ"], [11, 17, null], [16, 24, "\u0160J"], [17, 26, null], [17, 27, null], [19, 30, null], [20, 2, "AJ2"], [22, 36, "EVV"], [23, 37, "EVH"], [26, 20, "MA2"], [27, 18, null], [29, 8, null], [29, 9, null], [34, 20, "MA1"]], "se": [[0, 1, null], [1, 2, "AJ1"], [2, 3, "FJ"], [4, 7, "FJ"], [5, 9, null], [6, 12, "NJ"], [9, 0, "D\u00edv"], [10, 16, "NJ"], [11, 17, null], [13, 20, "MA1"], [14, 5, null], [14, 0, "Chl"], [16, 24, "\u0160J"], [17, 26, null], [17, 27, null], [19, 30, null], [20, 2, "AJ2"], [22, 36, "EVV"], [23, 37, "EVH"], [26, 18, null], [28, 8, null], [34, 20, "MA2"]], "si": [[1, 2, "AJ1"], [2, 3, "FJ"], [2, 4, "FK"], [3, 6, "PGS"], [4, 7, "FJ"], [5, 10, "P\u0158"], [6, 11, "NK"], [6, 12, "NJ"], [7, 13, "RJS1"], [8, 14, "EKS"], [9, 0, "D\u00edv"], [10, 16, "NJ"], [11, 17, null], [12, 2, "AJ2"], [13, 19, "MAS"], [14, 0, "Chl"], [15, 22, "HU"], [16, 23, "\u0160Ks"], [16, 24, "\u0160J"], [17, 25, "HU"], [19, 30, null], [21, 32, "P\u0158"], [21, 34, "LG"], [22, 35, "EVV"], [24, 39, "LA"], [26, 40, "DGS"], [27, 41, "CFY"], [27, 42, "CMn"], [27, 43, "FYS2"], [28, 45, "BIS"], [30, 46, "CSVZ"], [30, 27, null], [30, 28, null], [34, 20, null], [34, 49, "ZES"]], "zi": [[1, 2, "AJ1"], [2, 3, "FJ"], [2, 4, "FK"], [3, 6, "PGS"], [4, 7, "FJ"], [5, 10, "P\u0158"], [6, 11, "NK"], [6, 12, "NJ"], [8, 14, "EKS"], [9, 0, "Chl"], [10, 16, "NJ"], [12, 2, "AJ1"], [13, 19, "MAS"], [14, 0, "D\u00edv"], [15, 22, "HU"], [15, 17, null], [16, 23, "\u0160Ks"], [16, 24, "\u0160J"], [17, 25, "HU"], [17, 27, null], [17, 28, null], [18, 13, "RJS2"], [19, 30, null], [21, 32, "P\u0158"], [21, 34, "LG"], [22, 35, "EVV"], [24, 39, "LA"], [26, 40, "DGS"], [27, 41, "CFY"], [27, 42, "CMn"], [27, 43, "FYS2"], [28, 45, "BIS"], [30, 46, "CSVZ"], [34, 20, null], [34, 49, "ZES"]], "ko": [[4, 7, "FJ"], [6, 11, "NK"], [7, 13, "RJS"], [9, 0, "D\u00edv"], [10, 16, "NJ"], [12, 2, null], [14, 0, "Chl"], [15, 22, "HU"], [15, 17, null], [16, 24, "\u0160J"], [19, 30, null], [19, 31, "EUS"], [22, 35, "EVV"], [26, 40, "DGS"], [27, 41, "CFY"], [27, 42, "CMn"], [27, 43, "FYS2"], [27, 20, null], [28, 45, "BIS"], [29, 32, "P\u0158"], [29, 10, "P\u0158"], [30, 46, "CSVZ"], [30, 25, "HU"], [30, 27, null], [30, 28, null], [31, 39, null], [34, 19, "MAS"], [34, 49, "ZES"]]}

function questionStep(group, step, seed) {
  if (step < obecne.length) {
    return { text: obecne[step], options: [1, 2, 3, 4, 5] }
  } else {
    step -= obecne.length
  }
  if (step < table[group].length) {
    const [personId, subjectId, subgroup] = table[group][step]
    const [name, gender] = people[personId]
    const subject = subjects[subjectId]
    return { name, subject, questions: jednoduche[gender], doubleQuestions: dvojite[gender], options: [1, 2, 3, 4, 5], subgroup }
  }
  return { done: true }
}

module.exports = {tridy, questionStep}

from collections import defaultdict

class IdDict(dict):
  def put(self, item):
    try:
      return self[item]
    except KeyError:
      result = len(self)
      self[item] = result
      return result

  def list(self):
    result = [None] * len(self)
    for key, value in self.items():
      result[value] = key
    return result

subjects = IdDict()
tridy = {'1.A': 'pi', '1.B': 'bi', '2.': 'su', '3.': 'te', '4.': 'ka', '5.': 'ki', '6.': 'se', '7.A': 'si', '7.B': 'zi', '8.': 'ko'}
people = IdDict()

table = defaultdict(list)

for line in open("uvazky 2021 gjs.txt"):
  line = line.strip()
  if line.startswith("#"):
    person = people.put(line[1:])
  elif not line:
    continue
  else:
    subject, trida = line.split("; ")
    trida, *skupiny = trida.split()
    sk = skupiny[0] if skupiny else None
    table[tridy[trida]].append((person, subjects.put(subject), sk))

subjects = subjects.list()
people = people.list()
tridy = {'pi': 'prima A', 'bi': 'prima B', 'su': 'sekunda', 'te': 'tercie', 'ka': 'kvarta', 'ki': 'kvinta', 'se': 'sexta', 'si': 'septima A', 'zi': 'septima B', 'ko': 'oktáva'}

def print_human():
  for tr, tab in table.items():
    print(tridy[tr])
    for person, subject, skupiny in sorted(tab, key=lambda p: (subjects[p[1]], p[0])):
      print("\t", subjects[subject], people[person], skupiny)

def print_machine():
  import json
  print("const subjects =", subjects)
  print("const people =", people)
  print("const table =", json.dumps(table))

print_machine()

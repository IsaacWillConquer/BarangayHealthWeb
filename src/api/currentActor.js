let actor = { type: null, id: null };

export function setCurrentActor(type, id) {
  actor = { type, id };
}

export function getCurrentActor() {
  return actor;
}

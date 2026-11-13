const STORAGE_KEY = "cellar-deals-browse-scroll";
let savedBrowseScrollY = null;

export function saveBrowseScrollPosition(scrollY) {
  savedBrowseScrollY = scrollY;
  sessionStorage.setItem(STORAGE_KEY, String(scrollY));
}

export function takeBrowseScrollPosition() {
  const savedValue = sessionStorage.getItem(STORAGE_KEY);
  const scrollY = savedValue === null ? savedBrowseScrollY : Number(savedValue);
  savedBrowseScrollY = null;
  sessionStorage.removeItem(STORAGE_KEY);
  return scrollY;
}

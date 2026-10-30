"use strict";

function publicProjection(state) {
  const published = value => ["published", "public"].includes(String(value || "").trim().toLowerCase());
  const records = value => Array.isArray(value) ? value : [];
  const categories = records(state.categories);
  const visibleCategories = categories.filter(item => published(item.status) && published(item.visibility));
  const categoryIds = new Set(visibleCategories.map(item => item.id));
  const gallery = records(state.gallery).filter(photo => {
    if (!published(photo.status)) return false;
    const category = photo.categoryId ? categories.find(item => item.id === photo.categoryId) : categories.find(item => item.id === photo.category || item.name === photo.category);
    return !category || categoryIds.has(category.id);
  });
  const photoIds = new Set(gallery.map(photo => photo.id));
  const settings = structuredClone(state.settings || {});
  if (Array.isArray(settings.homeCategories)) settings.homeCategories = settings.homeCategories.filter(item => !item.categoryId || categoryIds.has(item.categoryId));
  if (Array.isArray(settings.homeSelection)) settings.homeSelection = settings.homeSelection.filter(item => photoIds.has(item.photoId));
  if (Array.isArray(settings.homeComparison?.entries)) settings.homeComparison.entries = settings.homeComparison.entries.filter(item => item && photoIds.has(item.photoId));
  delete settings.cityContent;
  if (settings.pageContent) delete settings.pageContent.city;
  if (settings.pageSeo) delete settings.pageSeo.city;
  const componentVisibility = structuredClone(state.componentVisibility || {});
  delete componentVisibility.city;
  return structuredClone({
    profile: state.profile,
    projects: records(state.projects).filter(item => published(item.status) && item.isVisible !== false).map(item=>({...item,...(Array.isArray(item.photoIds)?{photoIds:item.photoIds.filter(id=>photoIds.has(id))}:{})})),
    gallery,
    categories: visibleCategories,
    contact: state.contact && { ...state.contact, contactMethods: records(state.contact.contactMethods).filter(item => item.isVisible !== false) },
    settings,
    componentVisibility,
    messages: []
  });
}

module.exports = { publicProjection };

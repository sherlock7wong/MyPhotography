/* Ordered project collections shared by project pages and the editor. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.projectCollections=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const rows=value=>Array.isArray(value)?value:[];
 const published=value=>['published','public'].includes(String(value||'').trim().toLowerCase());
 function availablePhotos(data){
  const categories=rows(data?.categories);const publicCategories=new Set(categories.filter(c=>published(c.status)&&published(c.visibility)).map(c=>c.id));
  return rows(data?.gallery).filter(photo=>{if(!photo||!published(photo.status))return false;const category=categories.find(c=>photo.categoryId?c.id===photo.categoryId:c.id===photo.category||c.name===photo.category);return !category||publicCategories.has(category.id);});
 }
 function imageKey(value){try{return new URL(String(value||''),'https://cms.invalid/Project/index.html').href;}catch(_){return '';}}
 function photos(data,project){
  if(!project)return [];const gallery=availablePhotos(data);const map=new Map(gallery.map(photo=>[photo.id,photo]));
  if(Array.isArray(project.photoIds)){const seen=new Set();return project.photoIds.flatMap(id=>{const photo=map.get(id);if(!photo||seen.has(id))return [];seen.add(id);return [photo];});}
  if(!project.coverImage)return [];const same=gallery.find(photo=>imageKey(photo.image)===imageKey(project.coverImage));
  return same?[same]:[{id:'cover:'+project.id,title:project.title||'',image:project.coverImage,altText:project.coverAlt||project.title||'',description:project.description||'',location:project.location||'',year:project.year||'',legacyCover:true}];
 }
 function detailUrl(id,fromPage=1){const page=Number.isSafeInteger(Number(fromPage))&&Number(fromPage)>0?Number(fromPage):1;return '../Project/detail.html?project='+encodeURIComponent(String(id||''))+'&fromPage='+page;}
 return {pageSize:6,photos,availablePhotos,detailUrl};
});

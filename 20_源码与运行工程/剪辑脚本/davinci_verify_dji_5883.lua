local function object_values(collection)
  local values = {}
  if collection == nil then return values end
  for key, value in pairs(collection) do
    if type(value) == "userdata" or type(value) == "table" then
      table.insert(values, value)
    elseif type(key) == "userdata" or type(key) == "table" then
      table.insert(values, key)
    end
  end
  return values
end

local function safe_name(item)
  if item == nil then return "" end
  local ok, name = pcall(function() return item:GetName() end)
  if ok and name then return tostring(name) end
  return ""
end

local resolve = Resolve()
if resolve == nil then
  print("ERROR: Resolve unavailable")
  os.exit(1)
end

local pm = resolve:GetProjectManager()
local project = pm:GetCurrentProject()
if project == nil then
  print("ERROR: No current project")
  os.exit(1)
end

print("Project: " .. project:GetName())
print("Page: " .. tostring(resolve:GetCurrentPage()))
print("TimelineCount: " .. tostring(project:GetTimelineCount()))

local timeline = project:GetCurrentTimeline()
if timeline == nil then
  print("ERROR: No current timeline")
  os.exit(1)
end

print("CurrentTimeline: " .. timeline:GetName())
print("TimelineStart: " .. tostring(timeline:GetStartFrame()))
print("TimelineEnd: " .. tostring(timeline:GetEndFrame()))
print("VideoTrackCount: " .. tostring(timeline:GetTrackCount("video")))
print("AudioTrackCount: " .. tostring(timeline:GetTrackCount("audio")))

for track = 1, timeline:GetTrackCount("video"), 1 do
  local items = object_values(timeline:GetItemListInTrack("video", track))
  print("VideoTrack " .. tostring(track) .. " items: " .. tostring(#items))
  for i, item in ipairs(items) do
    print("  V" .. tostring(track) .. "." .. tostring(i) ..
      " name=" .. safe_name(item) ..
      " start=" .. tostring(item:GetStart(false)) ..
      " end=" .. tostring(item:GetEnd(false)) ..
      " duration=" .. tostring(item:GetDuration(false)))
  end
end

for track = 1, timeline:GetTrackCount("audio"), 1 do
  local items = object_values(timeline:GetItemListInTrack("audio", track))
  print("AudioTrack " .. tostring(track) .. " items: " .. tostring(#items))
  for i, item in ipairs(items) do
    print("  A" .. tostring(track) .. "." .. tostring(i) ..
      " name=" .. safe_name(item) ..
      " start=" .. tostring(item:GetStart(false)) ..
      " end=" .. tostring(item:GetEnd(false)) ..
      " duration=" .. tostring(item:GetDuration(false)))
  end
end

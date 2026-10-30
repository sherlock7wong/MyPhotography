local function fail(message)
  print("ERROR: " .. tostring(message))
  os.exit(1)
end

local function log_line(handle, message)
  local text = tostring(message)
  print(text)
  if handle then
    handle:write(text .. "\n")
    handle:flush()
  end
end

local function parse_number(value)
  if value == nil then return nil end
  local text = tostring(value):gsub(",", "")
  local n = text:match("([%d%.]+)")
  if n == nil then return nil end
  return tonumber(n)
end

local function parse_int(value)
  local n = parse_number(value)
  if n == nil then return nil end
  return math.floor(n)
end

local function parse_timecode_frames(value, fps)
  if value == nil then return nil end
  local text = tostring(value)
  local h, m, s, f = text:match("(%d+):(%d+):(%d+)[:;](%d+)")
  if h == nil then return nil end
  return math.floor(((tonumber(h) * 3600 + tonumber(m) * 60 + tonumber(s)) * fps) + tonumber(f))
end

local function clip_name(clip)
  if clip == nil then return "" end
  local ok, name = pcall(function() return clip:GetName() end)
  if ok and name then return tostring(name) end
  local fileName = clip:GetClipProperty("File Name")
  return tostring(fileName or "")
end

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

local function find_imported_clip(clips, expected_ext)
  local needle = expected_ext:lower()
  for _, clip in ipairs(object_values(clips)) do
    local name = clip_name(clip):lower()
    local fileName = tostring(clip:GetClipProperty("File Name") or ""):lower()
    local path = tostring(clip:GetClipProperty("File Path") or ""):lower()
    local videoCodec = tostring(clip:GetClipProperty("Video Codec") or "")
    local audioCodec = tostring(clip:GetClipProperty("Audio Codec") or "")
    if name:match(needle .. "$") or fileName:match(needle .. "$") or path:match(needle .. "$") then
      return clip
    end
    if needle == "%.mp3" and (name:lower():find("ridethewind", 1, true) or fileName:lower():find("ridethewind", 1, true)) then
      return clip
    end
    if needle == "%.mp3" and videoCodec == "" and audioCodec ~= "" then
      return clip
    end
    if needle == "%.mov" and videoCodec ~= "" then
      return clip
    end
  end
  return nil
end

local videoPath = os.getenv("CODEX_VIDEO")
local bgmPath = os.getenv("CODEX_BGM")
local projectBase = os.getenv("CODEX_PROJECT") or "DJI_5883_TealOrange_BGM"
local logPath = os.getenv("CODEX_LOG")

if videoPath == nil or videoPath == "" then fail("CODEX_VIDEO is missing") end
if bgmPath == nil or bgmPath == "" then fail("CODEX_BGM is missing") end

local logHandle = nil
if logPath and logPath ~= "" then
  logHandle = io.open(logPath, "w")
end

local resolve = Resolve()
if resolve == nil then fail("Resolve scripting connection failed") end

local projectManager = resolve:GetProjectManager()
if projectManager == nil then fail("Project manager unavailable") end

local currentProject = projectManager:GetCurrentProject()
if currentProject ~= nil then
  log_line(logHandle, "Current project before automation: " .. currentProject:GetName())
  local saved = projectManager:SaveProject()
  log_line(logHandle, "Saved current project before switching: " .. tostring(saved))
end

local project = nil
local projectName = projectBase
if currentProject ~= nil and currentProject:GetName():match("^" .. projectBase) then
  project = currentProject
  projectName = currentProject:GetName()
  log_line(logHandle, "Reusing current project: " .. projectName)
else
  for i = 0, 20, 1 do
    local candidate = projectBase
    if i > 0 then
      candidate = projectBase .. "_" .. tostring(i)
    end
    project = projectManager:CreateProject(candidate)
    if project ~= nil then
      projectName = candidate
      break
    end
  end
end
if project == nil then fail("Unable to create a unique project") end
log_line(logHandle, "Active automation project: " .. projectName)

project:SetSetting("timelineFrameRate", "29.97")
project:SetSetting("timelinePlaybackFrameRate", "29.97")
project:SetSetting("timelineResolutionWidth", "3840")
project:SetSetting("timelineResolutionHeight", "2160")
project:SetSetting("videoMonitorFormat", "UHD 2160p 29.97")

local mediaStorage = resolve:GetMediaStorage()
local mediaPool = project:GetMediaPool()
if mediaStorage == nil or mediaPool == nil then fail("Media storage or media pool unavailable") end

resolve:OpenPage("media")
local rootFolder = mediaPool:GetRootFolder()
local existingClips = {}
if rootFolder ~= nil then
  for _, clip in ipairs(object_values(rootFolder:GetClipList())) do table.insert(existingClips, clip) end
end

local existingVideo = find_imported_clip(existingClips, "%.mov")
local existingBgm = find_imported_clip(existingClips, "%.mp3")
local importPaths = {}
if existingVideo == nil then table.insert(importPaths, videoPath) end
if existingBgm == nil then table.insert(importPaths, bgmPath) end

local imported = {}
if #importPaths > 0 then
  imported = mediaStorage:AddItemListToMediaPool(importPaths)
  if imported == nil then fail("Import returned nil") end
end

local importedCount = 0
for _, _ in ipairs(object_values(imported)) do importedCount = importedCount + 1 end
log_line(logHandle, "Imported media count: " .. tostring(importedCount))

local allClips = {}
for _, clip in ipairs(object_values(imported)) do table.insert(allClips, clip) end
rootFolder = mediaPool:GetRootFolder()
if rootFolder ~= nil then
  for _, clip in ipairs(object_values(rootFolder:GetClipList())) do table.insert(allClips, clip) end
end

local allCount = 0
for _, _ in ipairs(allClips) do allCount = allCount + 1 end
log_line(logHandle, "Available media pool clips checked: " .. tostring(allCount))
for i, clip in ipairs(allClips) do
  local props = clip:GetClipProperty()
  log_line(logHandle, "Clip " .. tostring(i) ..
    " name=" .. tostring(clip_name(clip)) ..
    " fileName=" .. tostring(props["File Name"]) ..
    " filePath=" .. tostring(props["File Path"]) ..
    " videoCodec=" .. tostring(props["Video Codec"]) ..
    " audioCodec=" .. tostring(props["Audio Codec"]))
end

local videoClip = find_imported_clip(allClips, "%.mov")
local bgmClip = find_imported_clip(allClips, "%.mp3")
if videoClip == nil then fail("Imported MOV clip not found") end
if bgmClip == nil then fail("Imported MP3 clip not found") end

local videoProps = videoClip:GetClipProperty()
local fps = parse_number(videoProps["FPS"]) or parse_number(videoProps["Frame Rate"]) or 29.97
if fps < 1 then fps = 29.97 end
local frames = parse_int(videoProps["Frames"]) or parse_timecode_frames(videoProps["Duration"], fps)
if frames == nil or frames < math.floor(fps * 8) then
  frames = math.floor(fps * 90)
end

local res = tostring(videoProps["Resolution"] or "")
local width, height = res:match("(%d+)%s*x%s*(%d+)")
if width and height then
  project:SetSetting("timelineResolutionWidth", width)
  project:SetSetting("timelineResolutionHeight", height)
end
project:SetSetting("timelineFrameRate", tostring(fps))
project:SetSetting("timelinePlaybackFrameRate", tostring(fps))

log_line(logHandle, "Video clip: " .. clip_name(videoClip))
log_line(logHandle, "Source FPS: " .. tostring(fps))
log_line(logHandle, "Source frames used for planning: " .. tostring(frames))
log_line(logHandle, "Source resolution: " .. tostring(res))
log_line(logHandle, "BGM clip: " .. clip_name(bgmClip))

local function frames_from_seconds(seconds)
  return math.max(12, math.floor(seconds * fps + 0.5))
end

local maxStart = math.max(0, frames - frames_from_seconds(8))
local segmentPlan = {
  {pct = 0.02, len = 5.0, name = "Opening wide hold", zoom = 1.00, pan = 0, tilt = 0, color = "Blue"},
  {pct = 0.12, len = 4.0, name = "First push", zoom = 1.03, pan = -18, tilt = 0, color = "Teal"},
  {pct = 0.23, len = 3.0, name = "Rhythm cut 1", zoom = 1.05, pan = 22, tilt = -8, color = "Cyan"},
  {pct = 0.34, len = 4.5, name = "Reveal", zoom = 1.02, pan = 0, tilt = 12, color = "Green"},
  {pct = 0.48, len = 2.8, name = "Beat accent", zoom = 1.06, pan = -26, tilt = 8, color = "Yellow"},
  {pct = 0.58, len = 3.2, name = "Beat accent 2", zoom = 1.04, pan = 26, tilt = -6, color = "Orange"},
  {pct = 0.69, len = 4.0, name = "Float", zoom = 1.02, pan = 0, tilt = -12, color = "Purple"},
  {pct = 0.80, len = 3.0, name = "Final rise", zoom = 1.05, pan = -16, tilt = 0, color = "Pink"},
  {pct = 0.90, len = 6.0, name = "End breathing shot", zoom = 1.00, pan = 0, tilt = 0, color = "Blue"}
}

local clipInfos = {}
local plannedFrames = 0
for _, seg in ipairs(segmentPlan) do
  local lenFrames = frames_from_seconds(seg.len)
  if lenFrames > frames - 2 then lenFrames = math.max(12, frames - 2) end
  local startFrame = math.floor(seg.pct * math.max(0, frames - lenFrames - 1))
  local endFrame = math.min(frames - 1, startFrame + lenFrames - 1)
  if endFrame > startFrame then
    table.insert(clipInfos, {
      mediaPoolItem = videoClip,
      startFrame = startFrame,
      endFrame = endFrame
    })
    plannedFrames = plannedFrames + (endFrame - startFrame + 1)
  end
end

if #clipInfos == 0 then fail("No clip segments planned") end

local function timeline_name_exists(name)
  local timelineCount = project:GetTimelineCount()
  for i = 1, timelineCount, 1 do
    local timeline = project:GetTimelineByIndex(i)
    if timeline ~= nil and timeline:GetName() == name then
      return true
    end
  end
  return false
end

local timelineBaseName = "DJI_5883_teal_orange_creative_cut"
local timelineName = timelineBaseName
local suffix = 2
while timeline_name_exists(timelineName) do
  timelineName = timelineBaseName .. "_v" .. tostring(suffix)
  suffix = suffix + 1
end

local timeline = mediaPool:CreateEmptyTimeline(timelineName)
if timeline == nil then fail("Timeline creation failed") end
project:SetCurrentTimeline(timeline)
timeline:SetStartTimecode("00:00:00:00")
for _, clipInfo in ipairs(clipInfos) do
  mediaPool:AppendToTimeline({clipInfo})
end
timeline:SetTrackName("video", 1, "Creative cut")
while timeline:GetTrackCount("audio") < 1 do
  timeline:AddTrack("audio", "stereo")
end
timeline:SetTrackName("audio", 1, "Original camera audio")
while timeline:GetTrackCount("audio") < 2 do
  timeline:AddTrack("audio", "stereo")
end
timeline:SetTrackName("audio", 2, "BGM - Ride The Wind")

local videoItems = timeline:GetItemListInTrack("video", 1)
local index = 1
for _, item in ipairs(object_values(videoItems)) do
  local seg = segmentPlan[index] or segmentPlan[#segmentPlan]
  item:SetClipColor(seg.color)
  item:SetProperty("ZoomX", seg.zoom)
  item:SetProperty("ZoomY", seg.zoom)
  item:SetProperty("Pan", seg.pan)
  item:SetProperty("Tilt", seg.tilt)
  item:AddVersion("Teal orange CDL", 0)
  item:LoadVersionByName("Teal orange CDL", 0)
  local cdlOk = item:SetCDL({
    NodeIndex = "1",
    Slope = "1.08 1.03 0.94",
    Offset = "-0.018 0.004 0.024",
    Power = "0.93 0.97 1.04",
    Saturation = "1.18"
  })
  item:AddMarker(0, "Blue", seg.name, "Creative trim plus subtle motion; teal-orange CDL applied: " .. tostring(cdlOk), 1, "codex_segment")
  index = index + 1
end

local bgmProps = bgmClip:GetClipProperty()
local bgmFps = parse_number(bgmProps["FPS"]) or parse_number(bgmProps["Frame Rate"])
if bgmFps == nil then
  if fps > 30 then
    bgmFps = fps / 2
  else
    bgmFps = fps
  end
end
local bgmEnd = math.max(12, math.floor(plannedFrames * bgmFps / fps) - 1)
log_line(logHandle, "BGM planning FPS: " .. tostring(bgmFps))
local bgmItems = mediaPool:AppendToTimeline({
  {
    mediaPoolItem = bgmClip,
    startFrame = 0,
    endFrame = bgmEnd,
    mediaType = 2,
    trackIndex = 2,
    recordFrame = 0
  }
})

local bgmCount = 0
if bgmItems ~= nil then
  for _, item in ipairs(object_values(bgmItems)) do
    bgmCount = bgmCount + 1
    item:SetClipColor("Purple")
    local volOk = item:SetProperty("Volume", -18.0)
    if not volOk then
      item:SetProperty("AudioVolume", -18.0)
    end
    item:AddMarker(0, "Purple", "BGM credit", "'Ride The Wind' by Scott Buckley - CC-BY 4.0", 1, "codex_bgm_credit")
  end
end

timeline:AddMarker(0, "Green", "Edit note", "A1 preserves camera audio. A2 contains BGM. No render/export was started.", 1, "codex_overview")
timeline:AddMarker(math.floor(plannedFrames * 0.35), "Yellow", "Pace shift", "Shorter rhythmic cuts begin here.", 1, "codex_pace")
timeline:AddMarker(math.floor(plannedFrames * 0.75), "Blue", "Resolve", "Final rise and breathing end shot.", 1, "codex_final")

resolve:OpenPage("edit")
projectManager:SaveProject()

log_line(logHandle, "Timeline created: " .. timelineName)
log_line(logHandle, "Video segments: " .. tostring(#clipInfos))
log_line(logHandle, "Planned timeline frames: " .. tostring(plannedFrames))
log_line(logHandle, "BGM timeline items: " .. tostring(bgmCount))
log_line(logHandle, "Project saved: " .. projectName)

if logHandle then logHandle:close() end

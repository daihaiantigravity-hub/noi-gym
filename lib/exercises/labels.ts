const equipmentLabels: Record<string, string> = {
  Featured: "Nổi bật",
  Dumbbells: "Tạ đơn",
  Barbell: "Tạ đòn",
  Cables: "Cáp tập",
  Machine: "Máy tập",
  "Smith Machine": "Máy Smith",
  Cardio: "Tim mạch",
  Band: "Dây kháng lực",
  Bodyweight: "Trọng lượng cơ thể",
  Kettlebells: "Tạ ấm",
  Plate: "Đĩa tạ",
  "Medicine Ball": "Bóng tạ",
  TRX: "TRX",
  Stretches: "Giãn cơ",
  Pilates: "Pilates",
  Yoga: "Yoga",
  "Bosu Ball": "Bóng Bosu",
  Recovery: "Phục hồi",
  Vitruvian: "Máy Vitruvian",
  Exercises: "Bài tập",
};

const muscleLabels: Record<string, string> = {
  abdominals: "Cơ bụng",
  "anterior deltoid": "Vai trước",
  "anterior-deltoid": "Vai trước",
  biceps: "Cơ tay trước",
  calves: "Bắp chân",
  chest: "Cơ ngực",
  elbow: "Khuỷu tay",
  feet: "Bàn chân",
  forearms: "Cẳng tay",
  "front shoulders": "Vai trước",
  "front-shoulders": "Vai trước",
  gastrocnemius: "Cơ bụng chân",
  glutes: "Cơ mông",
  "gluteus maximus": "Cơ mông lớn",
  "gluteus-maximus": "Cơ mông lớn",
  "gluteus medius": "Cơ mông nhỡ",
  "gluteus-medius": "Cơ mông nhỡ",
  groin: "Cơ háng",
  hamstrings: "Cơ đùi sau",
  hands: "Bàn tay",
  hips: "Hông",
  "inner quadriceps": "Đùi trước trong",
  "inner-quadricep": "Đùi trước trong",
  "inner thigh": "Đùi trong",
  "inner-thigh": "Đùi trong",
  knees: "Đầu gối",
  "lateral deltoid": "Vai giữa",
  "lateral-deltoid": "Vai giữa",
  "lateral hamstrings": "Đùi sau ngoài",
  "lateral-hamstrings": "Đùi sau ngoài",
  lats: "Cơ xô",
  "long head bicep": "Đầu dài cơ tay trước",
  "long-head-bicep": "Đầu dài cơ tay trước",
  "long head tricep": "Đầu dài cơ tay sau",
  "long-head-tricep": "Đầu dài cơ tay sau",
  "lower abdominals": "Bụng dưới",
  "lower-abdominals": "Bụng dưới",
  "lower back": "Lưng dưới",
  lowerback: "Lưng dưới",
  "lower trapezius": "Cơ thang dưới",
  "lower-trapezius": "Cơ thang dưới",
  "medial hamstrings": "Đùi sau trong",
  "medial-hamstrings": "Đùi sau trong",
  "mid and lower chest": "Ngực giữa và dưới",
  "mid-lower-pectoralis": "Ngực giữa và dưới",
  neck: "Cổ",
  obliques: "Cơ liên sườn",
  "outer quadriceps": "Đùi trước ngoài",
  "outer-quadricep": "Đùi trước ngoài",
  "posterior deltoid": "Vai sau",
  "posterior-deltoid": "Vai sau",
  quads: "Cơ đùi trước",
  "rear shoulders": "Vai sau",
  "rear-shoulders": "Vai sau",
  "rectus femoris": "Cơ thẳng đùi",
  "rectus-femoris": "Cơ thẳng đùi",
  shoulders: "Vai",
  "short head bicep": "Đầu ngắn cơ tay trước",
  "short-head-bicep": "Đầu ngắn cơ tay trước",
  soleus: "Cơ dép",
  tibialis: "Cơ chày trước",
  traps: "Cơ thang",
  "traps (mid-back)": "Cơ thang giữa",
  "traps-middle": "Cơ thang giữa",
  triceps: "Cơ tay sau",
  "upper abdominals": "Bụng trên",
  "upper-abdominals": "Bụng trên",
  "upper pectoralis": "Ngực trên",
  "upper-pectoralis": "Ngực trên",
  "upper traps": "Cơ thang trên",
  "upper-trapezius": "Cơ thang trên",
  wrist: "Cổ tay",
  "wrist extensors": "Cơ duỗi cổ tay",
  "wrist-extensors": "Cơ duỗi cổ tay",
  "wrist flexors": "Cơ gấp cổ tay",
  "wrist-flexors": "Cơ gấp cổ tay",
  ankles: "Cổ chân",
};

const difficultyLabels: Record<string, string> = {
  Beginner: "Mới bắt đầu",
  Novice: "Cơ bản",
  Intermediate: "Trung bình",
  Advanced: "Nâng cao",
};

const statusLabels: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã xuất bản",
  Archived: "Đã lưu trữ",
};

const forceLabels: Record<string, string> = { Push: "Đẩy", Pull: "Kéo", Hold: "Giữ" };
const gripLabels: Record<string, string> = {
  Mixed: "Hỗn hợp",
  Neutral: "Trung lập",
  None: "Không áp dụng",
  Overhand: "Úp tay",
  Underhand: "Ngửa tay",
};
const mechanicLabels: Record<string, string> = { Compound: "Đa khớp", Isolation: "Cô lập" };

function getLabel(labels: Record<string, string>, value: string) {
  return labels[value] ?? labels[value.trim().toLowerCase()] ?? value;
}

export function getEquipmentLabel(value: string) {
  return getLabel(equipmentLabels, value);
}

export function getMuscleLabel(value: string) {
  return getLabel(muscleLabels, value);
}

export function getDifficultyLabel(value: string) {
  return getLabel(difficultyLabels, value);
}

export function getStatusLabel(value: string) {
  return getLabel(statusLabels, value);
}

export function getForceLabel(value: string) {
  return getLabel(forceLabels, value);
}

export function getGripLabel(value: string) {
  return getLabel(gripLabels, value);
}

export function getMechanicLabel(value: string) {
  return getLabel(mechanicLabels, value);
}

export function getGenderLabel(value: string) {
  return value === "female" ? "Nữ" : value === "male" ? "Nam" : value;
}

export function getAngleLabel(value: string) {
  return value === "front" ? "Chính diện" : value === "side" ? "Bên hông" : value;
}

import type { AppLanguage } from "@/lib/language";

const vietnameseLabels: Record<string, string> = {
  Featured: "Nổi bật", Dumbbells: "Tạ đơn", Barbell: "Tạ đòn", Cables: "Máy cáp", Machine: "Máy tập",
  "Smith Machine": "Máy Smith", Cardio: "Cardio", Band: "Dây kháng lực", Bodyweight: "Trọng lượng cơ thể",
  Kettlebells: "Tạ ấm", Plate: "Bánh tạ", "Medicine Ball": "Bóng tạ", TRX: "Dây TRX",
  Stretches: "Giãn cơ", Pilates: "Pilates", Yoga: "Yoga", "Bosu Ball": "Bóng BOSU", Recovery: "Phục hồi", Vitruvian: "Vitruvian",
  Abdominals: "Cơ bụng", Biceps: "Cơ tay trước", Calves: "Cơ bắp chân", Chest: "Cơ ngực", Forearms: "Cơ cẳng tay",
  "Front Shoulders": "Cơ vai trước", Glutes: "Cơ mông", Hamstrings: "Cơ đùi sau", Lats: "Cơ xô", "Lower back": "Lưng dưới",
  "Lower Back": "Lưng dưới", Obliques: "Cơ bụng chéo", Quads: "Cơ đùi trước", "Rear Shoulders": "Cơ vai sau",
  Shoulders: "Vai", Traps: "Cơ thang", Triceps: "Cơ tay sau", "Traps (mid-back)": "Cơ thang giữa", "Middle Traps": "Cơ thang giữa",
  "Anterior Deltoid": "Cơ vai trước", "Lateral Deltoid": "Cơ vai giữa", "Posterior Deltoid": "Cơ vai sau",
  "Gluteus Maximus": "Cơ mông lớn", "Gluteus Medius": "Cơ mông nhỡ", Gastrocnemius: "Cơ bụng chân",
  "Inner Thigh": "Mặt trong đùi", "Lateral Hamstrings": "Phần ngoài cơ đùi sau", "Medial Hamstrings": "Phần trong cơ đùi sau",
  "Long Head Bicep": "Đầu dài cơ tay trước", "Short Head Bicep": "Đầu ngắn cơ tay trước", "Long Head Tricep": "Đầu dài cơ tay sau",
  "Lower Abdominals": "Cơ bụng dưới", "Upper Abdominals": "Cơ bụng trên", "Lower Trapezius": "Cơ thang dưới",
  "Upper Traps": "Cơ thang trên", "Upper Trapezius": "Cơ thang trên", "Wrist Extensors": "Cơ duỗi cổ tay", "Wrist Flexors": "Cơ gấp cổ tay",
  Neck: "Cổ", Feet: "Bàn chân", Groin: "Bẹn", Tibialis: "Cơ chày", Soleus: "Cơ dép", "Outer Quadriceps": "Phần ngoài cơ đùi trước",
  "Inner Quadriceps": "Phần trong cơ đùi trước", "Rectus Femoris": "Cơ thẳng đùi", "Mid and Lower Chest": "Cơ ngực giữa và dưới",
  "Upper Pectoralis": "Cơ ngực trên", Hands: "Bàn tay", Elbow: "Khuỷu tay", Wrist: "Cổ tay", Hips: "Hông", Knees: "Đầu gối", Ankles: "Cổ chân",
  Beginner: "Mới bắt đầu", Novice: "Cơ bản", Intermediate: "Trung cấp", Advanced: "Chi tiết", Standard: "Cơ bản", Joints: "Khớp",
  Male: "Nam", Female: "Nữ", Front: "Trước", Back: "Sau",
  Monday: "Thứ hai", Tuesday: "Thứ ba", Wednesday: "Thứ tư", Thursday: "Thứ năm", Friday: "Thứ sáu", Saturday: "Thứ bảy", Sunday: "Chủ nhật",
  Push: "Đẩy", Pull: "Kéo", Legs: "Chân", Upper: "Thân trên", Lower: "Thân dưới", Flexible: "Linh hoạt",
  Arms: "Tay", Core: "Cơ trung tâm", "Cardio / Core / weak areas": "Cardio / Cơ trung tâm / Nhóm cơ cần cải thiện", "Rest or light cardio": "Nghỉ ngơi hoặc cardio nhẹ",
};

export function getExerciseLabel(language: AppLanguage, value: string) {
  if (language !== "vi") return value;
  // "Back" means the posterior view above, but the workout schedule refers to back muscles.
  return vietnameseLabels[value] ?? value;
}

export function getMuscleLabel(language: AppLanguage, value: string) {
  return language === "vi" && value === "Back" ? "Lưng" : getExerciseLabel(language, value);
}

export function getDifficultyLabel(language: AppLanguage, value: string) {
  return language === "vi" && value === "Advanced" ? "Nâng cao" : getExerciseLabel(language, value);
}

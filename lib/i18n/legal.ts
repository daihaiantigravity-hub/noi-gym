import type { AppLanguage } from "@/lib/language";

export type LegalKind = "privacy" | "terms";
type LegalContent = { title: string; description: string; sections: { title: string; text: string }[] };

const content: Record<AppLanguage, Record<LegalKind, LegalContent>> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      description: "How Noi Gym uses Google sign-in data and saved exercise information.",
      sections: [
        { title: "Data we use", text: "When you sign in with Google, Noi Gym receives your account identifier, name, email address, and public profile image to create your session and display your profile." },
        { title: "Saved exercises", text: "Your favorite exercises are linked to your account. Noi Gym uses aggregate save counts to prioritize exercises that interest the community. Individual identities and email addresses are not published in these aggregate statistics." },
        { title: "Data storage and protection", text: "Google provides authentication, while Supabase stores sign-in sessions and favorite exercise data. Noi Gym requests only basic Google permissions for account identity, email, and public profile data." },
        { title: "Your choices", text: "You can remove saved exercises and sign out at any time. For support related to account data, contact us at the email address below." },
      ],
    },
    terms: {
      title: "Terms of Use",
      description: "Terms that apply when using the Noi Gym exercise library.",
      sections: [
        { title: "Purpose of Noi Gym", text: "Noi Gym provides an exercise library for browsing, searching, and saving content that fits your needs. Content on this site does not replace medical advice or direct guidance from a qualified professional." },
        { title: "Safe use", text: "You are responsible for choosing exercise intensity that suits your health and ability. Stop exercising and seek professional advice if you experience pain, dizziness, or other unusual symptoms." },
        { title: "Accounts and favorite exercises", text: "You can sign in with Google to save exercises. You are responsible for protecting access to your Google account and for using the service without disrupting or harming others." },
        { title: "Service changes", text: "Content, features, and these terms may be updated to improve the service or meet operational needs. The most recent update date is always shown at the top of this page." },
      ],
    },
  },
  vi: {
    privacy: {
      title: "Chính sách quyền riêng tư",
      description: "Cách Noi Gym sử dụng dữ liệu đăng nhập Google và thông tin bài tập đã lưu.",
      sections: [
        { title: "Dữ liệu chúng tôi sử dụng", text: "Khi bạn đăng nhập bằng Google, Noi Gym nhận mã định danh tài khoản, tên, địa chỉ email và ảnh hồ sơ công khai để tạo phiên đăng nhập và hiển thị hồ sơ của bạn." },
        { title: "Bài tập đã lưu", text: "Các bài tập yêu thích được liên kết với tài khoản của bạn. Noi Gym sử dụng tổng lượt lưu để ưu tiên những bài tập được cộng đồng quan tâm. Danh tính và địa chỉ email của từng người không được công khai trong các thống kê tổng hợp này." },
        { title: "Lưu trữ và bảo vệ dữ liệu", text: "Google cung cấp dịch vụ xác thực, còn Supabase lưu phiên đăng nhập và dữ liệu bài tập yêu thích. Noi Gym chỉ yêu cầu các quyền Google cơ bản về định danh tài khoản, email và dữ liệu hồ sơ công khai." },
        { title: "Lựa chọn của bạn", text: "Bạn có thể bỏ lưu bài tập và đăng xuất bất kỳ lúc nào. Để được hỗ trợ về dữ liệu tài khoản, hãy liên hệ qua địa chỉ email bên dưới." },
      ],
    },
    terms: {
      title: "Điều khoản sử dụng",
      description: "Các điều khoản áp dụng khi sử dụng thư viện bài tập Noi Gym.",
      sections: [
        { title: "Mục đích của Noi Gym", text: "Noi Gym cung cấp thư viện bài tập để bạn xem, tìm kiếm và lưu nội dung phù hợp với nhu cầu. Nội dung trên trang không thay thế tư vấn y tế hoặc hướng dẫn trực tiếp từ chuyên gia có chuyên môn." },
        { title: "Sử dụng an toàn", text: "Bạn có trách nhiệm lựa chọn cường độ tập phù hợp với sức khỏe và khả năng của mình. Dừng tập và tìm tư vấn chuyên môn nếu bạn bị đau, chóng mặt hoặc có triệu chứng bất thường khác." },
        { title: "Tài khoản và bài tập yêu thích", text: "Bạn có thể đăng nhập bằng Google để lưu bài tập. Bạn có trách nhiệm bảo vệ quyền truy cập tài khoản Google của mình và sử dụng dịch vụ mà không gây gián đoạn hoặc gây hại cho người khác." },
        { title: "Thay đổi dịch vụ", text: "Nội dung, tính năng và các điều khoản này có thể được cập nhật để cải thiện dịch vụ hoặc đáp ứng nhu cầu vận hành. Ngày cập nhật gần nhất luôn được hiển thị ở đầu trang này." },
      ],
    },
  },
};

export function getLegalContent(language: AppLanguage, kind: LegalKind) {
  return {
    ...content[language][kind],
    back: language === "vi" ? "Về Noi Gym" : "Back to Noi Gym",
    updated: language === "vi" ? "Cập nhật ngày 22 tháng 10 năm 2026" : "Updated October 22, 2026",
    contact: language === "vi" ? "Liên hệ" : "Contact",
    otherTitle: content[language][kind === "privacy" ? "terms" : "privacy"].title,
  };
}

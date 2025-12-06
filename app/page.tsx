"use client";
import { useUserData } from "@/hooks/useUserData";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import {
	BookOpen,
	Shuffle,
	AlertTriangle,
	Star,
	LogIn,
	LogOut,
} from "lucide-react";

export default function Home() {
	const { user } = useUserData();

	const handleLogin = async () => {
		const provider = new GoogleAuthProvider();
		try {
			await signInWithPopup(auth, provider);
		} catch (error) {
			console.error("Login failed", error);
		}
	};

	const handleLogout = () => signOut(auth);

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8 text-center">
				<h1 className="text-4xl font-extrabold text-blue-600">AI-102 Master</h1>
				<p className="mt-2 text-gray-600">
					Azure AI Engineer Associate Exam Prep
				</p>

				{/* 用户信息区域 */}
				<div className="bg-white p-6 rounded-lg shadow-md">
					{!user ? (
						<div className="space-y-4">
							<p className="text-gray-500">
								Please login to save your progress
							</p>
							<button
								onClick={handleLogin}
								className="flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
							>
								<LogIn className="mr-2 h-5 w-5" /> Sign in with Google
							</button>
						</div>
					) : (
						<div className="flex flex-col items-center space-y-4">
							<p className="text-lg font-medium">
								Welcome, {user.displayName}!
							</p>
							<button
								onClick={handleLogout}
								className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
							>
								<LogOut className="mr-2 h-4 w-4" /> Sign out
							</button>
						</div>
					)}
				</div>

				{/* 导航菜单区域 */}
				<div className="grid grid-cols-1 gap-4 mt-8">
					<MenuLink
						href="/practice"
						title="Sequential Practice"
						desc="Start from Q1 to the end. Progress saved."
						icon={<BookOpen className="h-6 w-6 text-blue-500" />}
					/>
					<MenuLink
						href="/exam"
						title="Random Exam"
						desc="50 random questions. Test your skills."
						icon={<Shuffle className="h-6 w-6 text-purple-500" />}
					/>
					<MenuLink
						href="/mistakes"
						title="Mistake Notebook"
						desc="Review questions you answered incorrectly."
						icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
					/>
					<MenuLink
						href="/favorites"
						title="Favorites"
						desc="Your collection of bookmarked questions."
						icon={<Star className="h-6 w-6 text-yellow-500" />}
					/>
				</div>
			</div>
		</div>
	);
}

// 定义 Props 的类型接口
interface MenuLinkProps {
	href: string;
	title: string;
	desc: string;
	icon: React.ReactNode; // icon 是一个 React 组件（如 SVG）
}

// 辅助组件：使用定义好的接口替换 'any'
function MenuLink({ href, title, desc, icon }: MenuLinkProps) {
	return (
		<Link href={href} className="block group">
			<div className="flex items-center p-4 bg-white rounded-lg shadow transition-all duration-200 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-blue-500 cursor-pointer">
				<div className="shrink-0 mr-4">{icon}</div>
				<div className="text-left">
					<h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
						{title}
					</h3>
					<p className="text-sm text-gray-500">{desc}</p>
				</div>
			</div>
		</Link>
	);
}

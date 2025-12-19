"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	arrayUnion,
	arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

type UserDataType = {
	practiceIndex: number;
	mistakesIndex: number; // ✅ 新增：记录错题本进度
	favoritesIndex: number; // ✅ 新增：记录收藏夹进度
	mistakes: string[];
	favorites: string[];
};

export function useUserData() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const [userData, setUserData] = useState<UserDataType>({
		practiceIndex: 0,
		mistakesIndex: 0, // ✅ 初始化
		favoritesIndex: 0, // ✅ 初始化
		mistakes: [],
		favorites: [],
	});

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser);

			if (currentUser) {
				try {
					const docRef = doc(db, "users", currentUser.uid);
					const docSnap = await getDoc(docRef);

					if (docSnap.exists()) {
						const data = docSnap.data();
						setUserData({
							practiceIndex: data.practiceIndex || 0,
							// ✅ 读取进度，如果没有则默认为 0
							mistakesIndex: data.mistakesIndex || 0,
							favoritesIndex: data.favoritesIndex || 0,
							mistakes: data.mistakes || [],
							favorites: data.favorites || [],
						});
					} else {
						// 新用户初始化
						const initData = {
							practiceIndex: 0,
							mistakesIndex: 0,
							favoritesIndex: 0,
							mistakes: [],
							favorites: [],
						};
						await setDoc(docRef, initData);
						setUserData(initData);
					}
				} catch (error) {
					console.error("Error fetching user data:", error);
				}
			}
			setLoading(false);
		});
		return () => unsubscribe();
	}, []);

	// 保存顺序练习进度 (原有)
	const saveProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, practiceIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { practiceIndex: index });
	};

	// ✅ 新增：保存错题本进度
	const saveMistakesProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, mistakesIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { mistakesIndex: index });
	};

	// ✅ 新增：保存收藏夹进度
	const saveFavoritesProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, favoritesIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { favoritesIndex: index });
	};

	const toggleFavorite = async (questionId: string) => {
		if (!user) return;
		const isFav = userData.favorites.includes(questionId);
		const update = isFav ? arrayRemove(questionId) : arrayUnion(questionId);
		// 这里不需要重置 favoritesIndex，保持在当前页即可
		setUserData((prev) => ({
			...prev,
			favorites: isFav
				? prev.favorites.filter((id) => id !== questionId)
				: [...prev.favorites, questionId],
		}));
		await updateDoc(doc(db, "users", user.uid), { favorites: update });
	};

	const addMistake = async (questionId: string) => {
		if (!user || userData.mistakes.includes(questionId)) return;
		setUserData((prev) => ({
			...prev,
			mistakes: [...prev.mistakes, questionId],
		}));
		await updateDoc(doc(db, "users", user.uid), {
			mistakes: arrayUnion(questionId),
		});
	};

	const removeMistake = async (questionId: string) => {
		if (!user) return;
		setUserData((prev) => ({
			...prev,
			mistakes: prev.mistakes.filter((id) => id !== questionId),
		}));
		await updateDoc(doc(db, "users", user.uid), {
			mistakes: arrayRemove(questionId),
		});
	};

	return {
		user,
		userData,
		loading,
		saveProgress,
		saveMistakesProgress, // ✅ 导出
		saveFavoritesProgress, // ✅ 导出
		toggleFavorite,
		addMistake,
		removeMistake,
	};
}

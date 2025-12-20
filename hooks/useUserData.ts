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

type UserSelection = string | string[] | Record<number, string> | null;

type UserDataType = {
	practiceIndex: number;
	mistakesIndex: number;
	favoritesIndex: number;
	mistakes: string[];
	favorites: string[];
	answers: Record<string, UserSelection>;
	mistakeCounts: Record<string, number>;
};

export function useUserData() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const [userData, setUserData] = useState<UserDataType>({
		practiceIndex: 0,
		mistakesIndex: 0,
		favoritesIndex: 0,
		mistakes: [],
		favorites: [],
		answers: {},
		mistakeCounts: {},
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
							mistakesIndex: data.mistakesIndex || 0,
							favoritesIndex: data.favoritesIndex || 0,
							mistakes: data.mistakes || [],
							favorites: data.favorites || [],
							answers: data.answers || {},
							mistakeCounts: data.mistakeCounts || {},
						});
					} else {
						const initData = {
							practiceIndex: 0,
							mistakesIndex: 0,
							favoritesIndex: 0,
							mistakes: [],
							favorites: [],
							answers: {},
							mistakeCounts: {},
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

	const saveProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, practiceIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { practiceIndex: index });
	};

	const saveMistakesProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, mistakesIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { mistakesIndex: index });
	};

	const saveFavoritesProgress = async (index: number) => {
		if (!user) return;
		setUserData((prev) => ({ ...prev, favoritesIndex: index }));
		await updateDoc(doc(db, "users", user.uid), { favoritesIndex: index });
	};

	const toggleFavorite = async (questionId: string) => {
		if (!user) return;
		const isFav = userData.favorites.includes(questionId);
		const update = isFav ? arrayRemove(questionId) : arrayUnion(questionId);

		setUserData((prev) => ({
			...prev,
			favorites: isFav
				? prev.favorites.filter((id) => id !== questionId)
				: [...prev.favorites, questionId],
		}));

		await updateDoc(doc(db, "users", user.uid), { favorites: update });
	};

	// ✅ 核心：增加错题计数
	// hooks/useUserData.ts

	const addMistake = async (questionId: string) => {
		if (!user) return;

		// ✅ 修复逻辑：计算当前的基础次数
		const isAlreadyInMistakes = userData.mistakes.includes(questionId);
		const storedCount = userData.mistakeCounts[questionId] || 0;

		// 如果已经在错题本里，但没有存储次数（旧数据），基础值应视为 1。
		// 如果是新加入的错题（Practice模式），基础值是 0。
		const effectiveCurrentCount =
			isAlreadyInMistakes && storedCount === 0 ? 1 : storedCount;

		const newCount = effectiveCurrentCount + 1;

		// 更新本地状态
		setUserData((prev) => ({
			...prev,
			mistakes: prev.mistakes.includes(questionId)
				? prev.mistakes
				: [...prev.mistakes, questionId],
			mistakeCounts: {
				...prev.mistakeCounts,
				[questionId]: newCount,
			},
		}));

		// 更新 Firebase
		await updateDoc(doc(db, "users", user.uid), {
			mistakes: arrayUnion(questionId),
			[`mistakeCounts.${questionId}`]: newCount,
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

	const recordAnswer = async (questionId: string, answer: UserSelection) => {
		if (!user) return;
		setUserData((prev) => ({
			...prev,
			answers: { ...prev.answers, [questionId]: answer },
		}));
		await updateDoc(doc(db, "users", user.uid), {
			[`answers.${questionId}`]: answer,
		});
	};

	return {
		user,
		userData,
		loading,
		saveProgress,
		saveMistakesProgress,
		saveFavoritesProgress,
		toggleFavorite,
		addMistake,
		removeMistake,
		recordAnswer,
	};
}

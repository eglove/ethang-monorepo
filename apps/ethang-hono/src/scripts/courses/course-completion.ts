/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
type UserToken = {
    exp: number;
    iat: number;
    sub: string;
    email: string;
    username: string;
    role?: string;
}

type CourseStatus = {
    status: string,
    id: string,
    courseId: string,
    userId: string
}

const init = async () => {
    const token = await cookieStore.get("ethang-auth-token");

    if (!token?.value) {
        return;
    }

    const userData = parseJwt(token.value);

    if (!userData) {
        return;
    }

    const expiresDate = new Date(userData.exp * 1000);

    if (expiresDate < new Date()) {
        await cookieStore.delete("ethang-auth-token");
        return;
    }

    const response = await fetch(`/api/course-tracking/${userData.sub}`);
    const courseStatuses = await response.json<{
        data: Array<CourseStatus>,
        status: number
    }>();

    document.querySelectorAll<HTMLButtonElement>(".course-completion-button").forEach(button => {
        button.classList.remove("hidden");

        const courseId = button.dataset["courseId"];

        if (!courseId) {
            return;
        }

        const found = courseStatuses?.data?.find(status => status?.courseId === courseId);
        const statusElement = button.parentElement?.querySelector<HTMLDivElement>(".course-status-text");

        setUiState(statusElement, button, found);

        button.addEventListener("click", async () => {
            button.disabled = true;
            button.classList.remove("cursor-pointer");
            button.classList.add("animate-spin", "cursor-progress");
            const response = await fetch(`/api/course-tracking/${userData.sub}/${courseId}`, {
                method: "PUT",
                body: JSON.stringify({})
            });

            if (response.ok) {
                const data = await response.json<{
                    data: CourseStatus,
                    status: number
                }>();
                setUiState(statusElement, button, data.data);
            }
            button.disabled = false;
            button.classList.remove("animate-spin", "cursor-progress");
            button.classList.add("cursor-pointer");
            setPercentages();
        })
    })
};

if ("loading" === document.readyState) {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

const setUiState = (statusElement: HTMLDivElement | null | undefined, button: HTMLButtonElement, courseStatus: CourseStatus | undefined) => {
    if (statusElement) {
        statusElement.textContent = courseStatus?.status ?? "Incomplete";
    }

    if ("Complete" === courseStatus?.status) {
        button.classList.add("bg-brand");
        button.classList.remove("bg-neutral-secondary-medium", "bg-warning");
    } else if ("Revisit" === courseStatus?.status) {
        button.classList.add("bg-warning");
        button.classList.remove("bg-neutral-secondary-medium", "bg-brand");
    } else {
        button.classList.add("bg-neutral-secondary-medium");
        button.classList.remove("bg-brand", "bg-warning");
    }
}

const setPercentages = () => {
    const statusTexts = document.querySelectorAll<HTMLDivElement>(".course-status-text");

    let complete = 0;
    let incomplete = 0;
    let revisit = 0;
    let total = 0;

    for (const statusText of statusTexts) {
        total += 1;

        if ("Complete" === statusText.textContent) {
            complete += 1;
        } else if ("Revisit" === statusText.textContent) {
            revisit += 1;
        } else if ("Incomplete" === statusText.textContent) {
            incomplete += 1;
        }
    }

    const formatter = new Intl.NumberFormat("en-US", {
        style: "percent",
    });
    const completeProgress = document.querySelector('#complete-progress');
    const incompleteProgress = document.querySelector('#incomplete-progress');
    const revisitProgress = document.querySelector('#revisit-progress');

    if (completeProgress) {
        completeProgress.textContent = formatter.format(complete / total);
        completeProgress.setAttribute("style", `width: ${complete / total * 100}%`);
    }

    if (incompleteProgress) {
        incompleteProgress.textContent = formatter.format(incomplete / total);
        incompleteProgress.setAttribute("style", `width: ${incomplete / total * 100}%`);
    }

    if (revisitProgress) {
        revisitProgress.textContent = formatter.format(revisit / total);
        revisitProgress.setAttribute("style", `width: ${revisit / total * 100}%`);
    }
}

const parseJwt = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url?.replace(/-/g, '+').replace(/_/g, '/');

    if (base64) {
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload) as UserToken;
    }

    return undefined;
}
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

        button.addEventListener("click", () => {
            button.disabled = true;
            button.classList.remove("cursor-pointer");
            button.classList.add("animate-spin", "cursor-progress");
            fetch(`/api/course-tracking/${userData.sub}/${courseId}`, {
                method: "PUT",
                body: JSON.stringify({})
            }).then(response => {
                return response.json<{ data: CourseStatus, status: number }>();
            }).then(data => {
                setUiState(statusElement, button, data.data);
            }).catch(console.error).finally(() => {
                button.disabled = false;
                button.classList.remove("animate-spin", "cursor-progress");
                button.classList.add("cursor-pointer");
            });
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
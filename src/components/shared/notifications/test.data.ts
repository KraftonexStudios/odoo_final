export interface Notification {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  time: string;
  read: boolean;
  type: "comment" | "like" | "generation" | "invite";
}

export const notifications: Notification[] = [
  {
    id: "1",
    user: {
      name: "Redlance",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Redlance",
    },
    action: "Commented on",
    target: "Classic Car in Studio",
    time: "10 min",
    read: false,
    type: "comment",
  },
  {
    id: "2",
    user: {
      name: "Cute Turtle",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CuteTurtle",
    },
    action: "is generated",
    target: "Make texture - USB Style",
    time: "18 min",
    read: false,
    type: "generation",
  },
  {
    id: "3",
    user: {
      name: "SD",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SD",
    },
    action: "object is generated",
    target: "Minimalist Architecture Scene",
    time: "29 min",
    read: false,
    type: "generation",
  },
  {
    id: "4",
    user: {
      name: "Luna",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    },
    action: "Liked",
    target: "Classic Car in Studio",
    time: "1 hr",
    read: true,
    type: "like",
  },
  {
    id: "5",
    user: {
      name: "Alex",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    },
    action: "3D object is generated",
    target: "Classic Car in Studio",
    time: "2 hrs",
    read: true,
    type: "generation",
  },
];
